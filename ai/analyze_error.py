import os
import sys

from google import genai


def analyze_error(error_log):
    client = genai.Client(
        api_key=os.environ["AI_API_KEY"]
    )

    model = os.getenv(
        "GEMINI_MODEL",
        "gemini03.8-flash"
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

    response = client.responses.create(
        model=model,
        input=prompt,
    )

    return response.output_text


if __name__ == "__main__":
    try:
        with open("error.log", "r", encoding="utf-8") as file:
            error_log = file.read()
    except FileNotFoundError:
        print("error.log 파일을 찾을 수 없습니다.")
        exit(1)

    result = analyze_error(error_log)

    print("===================================")
    print("AI ERROR ANALYSIS")
    print("===================================")
    print(result)

    with open("analysis.log", "w", encoding="utf-8") as file:
        file.write(result)