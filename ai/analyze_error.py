import os
import time
from pathlib import Path
from datetime import datetime, timezone, timedelta

from google import genai
from google.genai import errors

MAX_RETRIES = 3

ROOT_DIR = Path(__file__).resolve().parent.parent

ERROR_LOG = ROOT_DIR / "error.log"
ANALYSIS_LOG = ROOT_DIR / "analysis.log"

KST = timezone(timedelta(hours=9))

PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

FALLBACK_MODEL = (
    "gemini-3.7-flash" if PRIMARY_MODEL == "gemini-3.8-flash" else "gemini-3.8-flash"
)


def analyze_error(error_log):
    client = genai.Client(api_key=os.environ["AI_API_KEY"])

    model = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")

    prompt = f"""
너는 소프트웨어 테스트 오류를 분석하는 개발 보조 AI다.

다음은 GitHub Actions에서 발생한 테스트 오류 로그다.

오류 로그:
--------------------
{error_log}
--------------------

다음 형식으로 분석해라.

1. 오류가 발생한 파일
2. 오류가 발생한 코드 위치
3. 직접적인 오류 원인
4. 어떤 동작에서 문제가 발생했는지
5. 수정 방향

코드를 임의로 수정하지 말고,
로그에서 확인할 수 있는 사실과 추론을 구분해서 설명해라.
"""
    models = [
        PRIMARY_MODEL,
        FALLBACK_MODEL,
    ]


    for model in models:
        result = request_gemini(
            client,
            model,
            prompt,
        )

        if result is not None:
            return result

        print(f"{model} 사용 실패. " f"다음 모델로 전환합니다.")

    raise RuntimeError("사용 가능한 Gemini 모델이 없습니다.")


def request_gemini(client, model, prompt):
    for attempt in range(MAX_RETRIES):
        try:
            print(
                f"Gemini API 요청 "
                f"(모델: {model}, 시도: {attempt + 1}/{MAX_RETRIES})"
            )

            response = client.models.generate_content(
                model=model,
                contents=prompt,
            )

            return response.text

        except errors.ClientError as e:
            if e.code == 429 and model == PRIMARY_MODEL:
                print(f"{model} quota 초과. " f"{FALLBACK_MODEL}으로 전환합니다.")
                return None

            raise

        except errors.ServerError as e:
            print(f"Gemini API 서버 오류 " f"(시도 {attempt + 1}/{MAX_RETRIES}): {e}")

            if attempt == MAX_RETRIES - 1:
                print(f"{model} 재시도 횟수 초과")
                return None

            wait_time = 10 * (2**attempt)

            print(f"{wait_time}초 후 재시도합니다.")
            time.sleep(wait_time)

    return None


def main():
    started_at = datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S KST")
    finished_at = datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S KST")

    if not ERROR_LOG.exists():
        print(f"error.log 파일을 찾을 수 없습니다: {ERROR_LOG}")
        exit(1)

    error_log = ERROR_LOG.read_text(encoding="utf-8")

    result = analyze_error(error_log)

    analysis_content = f"""===================================
AI ERROR ANALYSIS
===================================
Analysis Started At: {started_at}

{result}

Analysis Finished At: {finished_at}
"""

    ANALYSIS_LOG.write_text(analysis_content, encoding="utf-8")

    print(f"분석 로그 저장 완료: {ANALYSIS_LOG}")


if __name__ == "__main__":
    main()
