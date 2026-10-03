import os
import time
from pathlib import Path
from datetime import datetime, timezone, timedelta

from google import genai
from google.genai import errors

ROOT_DIR = Path(__file__).resolve().parent.parent

ERROR_LOG = ROOT_DIR / "error.log"
ANALYSIS_LOG = ROOT_DIR / "analysis.log"

KST = timezone(timedelta(hours=9))

def analyze_error(error_log):
    client = genai.Client(
        api_key=os.environ["AI_API_KEY"]
    )

    model = os.getenv(
        "GEMINI_MODEL",
        "gemini-3.7-flash"
    )

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
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
            )

            return response.text

        except errors.ServerError as e:
            print(
                f"Gemini API 서버 오류 "
                f"(시도 {attempt + 1}/3): {e}"
            )

            if attempt == 2:
                raise

            wait_time = 10 * (2 ** attempt)
            print(f"{wait_time}초 후 재시도합니다.")
            time.sleep(wait_time)


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

    ANALYSIS_LOG.write_text(
        analysis_content,
        encoding="utf-8"
    )

    print(f"분석 로그 저장 완료: {ANALYSIS_LOG}")


if __name__ == "__main__":
    main()