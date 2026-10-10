
import json
import os
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

from google import genai
from google.genai import errors

MAX_RETRIES = 3

PRIMARY_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.8-flash",
)

FALLBACK_MODEL = (
    "gemini-3.7-flash"
    if PRIMARY_MODEL == "gemini-3.8-flash"
    else "gemini-3.8-flash"
)

ROOT_DIR = Path(__file__).resolve().parent.parent
INPUT_FILE = ROOT_DIR / "change_context.json"
OUTPUT_FILE = ROOT_DIR / "code_review.log"

KST = timezone(timedelta(hours=9))

MAX_REVIEW_CHARS = 120_000


def request_gemini(client, model, prompt):
    for attempt in range(MAX_RETRIES):
        try:
            print(
                f"Gemini API 요청 "
                f"(모델: {model}, "
                f"시도: {attempt + 1}/{MAX_RETRIES})"
            )

            response = client.models.generate_content(
                model=model,
                contents=prompt,
            )

            result = response.text

            if result and result.strip():
                return result

            print(f"{model} 모델이 빈 응답을 반환했습니다.")

        except errors.ClientError as e:
            if e.code == 429:
                print(f"{model} 사용량 제한: {e}")
                return None

            if e.code != 408:
            # 인증 오류, 잘못된 요청 등의 4xx는
            # 같은 요청을 반복해도 해결되지 않을 수 있음
                raise

            print(f"{model} 요청 시간 초과"
                  f"(시도 {attempt + 1}/{MAX_RETRIES}): {e}")

        except errors.ServerError as e:
            print(
                f"{model} 서버 오류 "
                f"(시도 {attempt + 1}/{MAX_RETRIES}): {e}"
            )

        if attempt < MAX_RETRIES - 1:
            wait_time = 10 * (2 ** attempt)
            print(f"{wait_time}초 후 재시도합니다.")
            time.sleep(wait_time)

    return None


def analyze_with_fallback(client, prompt):
    for model in dict.fromkeys(
        [PRIMARY_MODEL, FALLBACK_MODEL]
    ):
        result = request_gemini(client, model, prompt)

        if result is not None:
            return model, result

        print(f"{model} 분석 실패. 다음 모델을 시도합니다.")

    raise RuntimeError(
        "모든 Gemini 모델의 요청이 실패했습니다."
    )

def load_changes():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"변경 코드 수집 파일이 없습니다: {INPUT_FILE}"
        )

    data = json.loads(INPUT_FILE.read_text(encoding="utf-8"))

    if not isinstance(data.get("changed_files"), list):
        raise ValueError("change_context.json 형식이 올바르지 않습니다.")

    return data


MAX_BATCH_CHARS = 30_000
MAX_FILE_SECTION_CHARS = 24_000

REVIEW_INSTRUCTIONS = """
너는 백엔드 서비스의 코드 변경을 검토하는 시니어 개발자다.
목표는 코드 스타일을 평가하는 것이 아니라, 이번 변경으로 발생할 수 있는
실제 결함과 기존 기능의 회귀 위험을 근거 중심으로 찾아내는 것이다.

반드시 제공된 변경 내용과 코드 문맥을 근거로 판단하라.
코드에 없는 함수, 파일, 동작을 가정하지 마라.
검토할 근거가 부족하면 문제라고 단정하지 말고 판단 한계를 밝혀라.

## 1. 변경 코드의 논리 오류
- 조건문, 반복문, 연산자, 반환값이 의도한 동작과 일치하는지 확인하라.
- 경계값, 빈 값, None/null, 잘못된 자료형에서 문제가 발생하는지 확인하라.
- 비동기 함수의 await 누락, 잘못된 실행 순서, 경쟁 상태 가능성을 확인하라.
- 새 코드가 기존 동작이나 함수 계약을 깨뜨리는지 확인하라.

## 2. 예외 및 오류 처리
- 실패할 수 있는 DB, 파일, 네트워크, 외부 API 호출의 오류 처리를 확인하라.
- 예외를 무시하거나 잘못된 성공 응답으로 바꾸는 코드가 있는지 확인하라.
- 오류가 발생했을 때 자원 정리와 트랜잭션 처리가 적절한지 확인하라.
- 오류 응답과 로그가 실제 문제를 진단할 수 있는 수준인지 확인하라.
- 모든 코드에 무조건 try/except를 추가하라고 요구하지 마라.
  실제로 처리되지 않은 실패 경로가 있을 때만 지적하라.

## 3. 모듈 간 연결과 인터페이스
- 함수 호출부와 정의부의 인자, 반환값, 비동기 여부가 일치하는지 확인하라.
- 라우터, 컨트롤러, 미들웨어, 유틸리티 사이의 호출 흐름을 확인하라.
- API 요청 및 응답의 필드명, 자료형, 필수값이 서로 일치하는지 확인하라.
- DB 쿼리의 파라미터와 실제 전달되는 데이터가 일치하는지 확인하라.
- 변경된 함수나 모듈을 호출하는 코드가 제공되지 않았다면,
  호출 관계를 확인할 수 없다고 명시하라.

## 4. 데이터베이스 및 데이터 처리
- SQL 쿼리에서 사용자 입력이 안전하게 처리되는지 확인하라.
- INSERT, UPDATE, DELETE의 조건과 영향 범위가 적절한지 확인하라.
- DB 결과가 없거나 중복되거나 예상한 형식이 아닐 때를 확인하라.
- 트랜잭션이 필요한 여러 작업이 부분적으로만 반영될 가능성을 확인하라.
- DB 스키마나 제약 조건이 제공되지 않았다면 추측으로 단정하지 마라.

## 5. 보안 및 서비스 안정성
- 인증 및 권한 확인 누락, SQL 인젝션, 민감 정보 노출 가능성을 확인하라.
- 입력값 검증과 파일·경로 처리의 안전성을 확인하라.
- 외부 API의 시간 초과, 실패 응답, 예상치 못한 응답 형식을 확인하라.
- 재시도 로직이 중복 요청이나 중복 데이터 생성으로 이어질 수 있는지 확인하라.
- 근거가 없는 보안 위험을 일반론만으로 지적하지 마라.

## 6. 유지보수성 및 회귀 위험
- 기존 기능의 동작이나 다른 모듈의 사용 방식이 바뀌는지 확인하라.
- 동일한 규칙이 여러 곳에 중복되어 불일치할 위험이 있는지 확인하라.
- 함수의 책임이 불명확하거나 변경 범위가 불필요하게 넓은지 확인하라.
- 단순한 취향 차이나 스타일 차이는 실제 유지보수상 문제가 되지 않는 한
  결함으로 보고하지 마라.

## 7. 검토 우선순위
다음 순서로 중요하게 판단하라.
1. 서비스 중단, 데이터 손실, 권한 우회 등 심각한 문제
2. 특정 입력이나 상황에서 기능이 잘못 동작하는 문제
3. 예외 처리 및 모듈 간 계약 불일치
4. 유지보수성과 가독성 개선 사항

## 8. 결과 작성 규칙
문제가 발견되면 각각 다음 형식으로 작성하라.

[문제 번호]
- 심각도: 높음 / 보통 / 낮음
- 유형: 논리 오류 / 예외 처리 / 연결 오류 / 데이터 처리 / 보안 / 유지보수
- 파일 및 위치: 확인 가능한 파일과 줄 번호
- 문제 설명: 어떤 동작이 왜 잘못될 수 있는지
- 발생 조건 및 영향: 어떤 상황에서 문제가 발생하고 무엇에 영향을 주는지
- 근거: 제공된 코드의 구체적인 부분
- 개선 방향: 문제를 해결하는 구체적인 방법

줄 번호를 확인할 수 없다면 임의의 줄 번호를 만들지 말고
함수명이나 코드 일부로 위치를 표시하라.

확실한 결함과 잠재적 위험을 구분하라.
같은 원인에서 발생한 문제를 여러 항목으로 중복 보고하지 마라.
개선할 점이 있더라도 실제 결함이 아니라면 그 사실을 구분하라.

문제를 발견하지 못한 경우에는 검토 범위에서 뚜렷한 문제를
발견하지 못했다고 작성하라. 전체 시스템이 완벽하다고 단정하지 마라.

마지막에 다음을 요약하라.
- 가장 중요한 발견 사항
- 추가 확인이 필요한 사항
- 검토 범위의 한계
"""

def build_prompt(data):
    batches = []
    current_sections = []
    current_size = 0

    for item in data["changed_files"]:
        diff = item.get("diff") or "(변경 내용 없음)"
        content = item.get("content") or "(현재 파일 없음)"

        # 변경 사항은 보존하고 전체 코드에 먼저 길이 제한 적용
        diff = diff[:MAX_FILE_SECTION_CHARS]
        remaining = max(
            0,
            MAX_FILE_SECTION_CHARS - len(diff),
        )
        content = content[:remaining]

        section = f"""
파일: {item["path"]}
변경 상태: {item["status"]}

[커밋에서 변경된 내용]
{diff}

[검토 커밋 기준의 현재 파일 내용]
{content}
"""

        if current_sections and (
            current_size + len(section) > MAX_BATCH_CHARS
        ):
            batches.append(current_sections)
            current_sections = []
            current_size = 0

        current_sections.append(section)
        current_size += len(section)

    if current_sections:
        batches.append(current_sections)

    prompts = []

    for index, sections in enumerate(batches, start=1):
        prompt = f"""{REVIEW_INSTRUCTIONS}

## 커밋 정보
기준 커밋: {data["base_sha"]}
검토 커밋: {data["head_sha"]}
이번 검토 묶음: {index}/{len(batches)}

## 검토 대상 코드
아래에 제공된 파일만 실제로 확인할 수 있는 대상으로 취급하라.
현재 파일 내용은 검토 커밋 기준이며, 변경된 코드는 diff를 기준으로
어떤 부분이 바뀌었는지 파악하라.

{"".join(sections)}
"""
        prompts.append(prompt)

    return prompts


def main():
    started_at = datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S KST")

    data = None
    
    try:
        data = load_changes()

        if not data["changed_files"]:
            result = "검토할 변경 파일이 없습니다."
            used_models = []
            
        else:
            api_key = os.getenv("AI_API_KEY")

            if not api_key:
                raise RuntimeError("AI_API_KEY 환경 변수가 없습니다.")

            prompts = build_prompt(data)
            client = genai.Client(api_key=api_key)

            results = []
            used_models = []

            for index, prompt in enumerate(prompts, start=1):
                print(f"코드 리뷰 진행: {index}/{len(prompts)}")

                used_model, review = analyze_with_fallback(client, prompt)
                used_models.append(used_model)

                results.append(f"## 리뷰 {index}\n\n{review}")

            result = "\n\n".join(results)

        finished_at = datetime.now(KST).strftime(
            "%Y-%m-%d %H:%M:%S KST"
        )

        model_summary = (
            ", ".join(dict.fromkeys(used_models))
            if used_models
            else "N/A"
        )

        output = f"""===================================
AI CODE REVIEW
===================================
Model Used: {model_summary}
Started At: {started_at}
Base Commit: {data.get("base_sha", "N/A")}
Head Commit: {data.get("head_sha", "N/A")}

{result}

Finished At: {finished_at}
"""

        OUTPUT_FILE.write_text(
            output, 
            encoding="utf-8"
            )
        print(f"코드 리뷰 결과 저장 완료: {OUTPUT_FILE}")

    except Exception as error:
        error_output = f"""===================================
AI CODE REVIEW FAILED
===================================
Started At: {started_at}
Finished At: {finished_at}
Error: {type(error).__name__}: {error}
"""
        OUTPUT_FILE.write_text(
            error_output, 
            encoding="utf-8"
            )
        raise


if __name__ == "__main__":
    main()
