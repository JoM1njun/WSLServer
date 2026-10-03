#!/bin/bash

REPO="JoM1njun/WSLServer"
WORKFLOW="AI Test Analysis"

echo "GitHub Actions 확인 중..."

RUN_ID=$(gh run list \
    --repo "$REPO" \
    --workflow "$WORKFLOW" \
    --limit 1 \
    --json databaseId \
    --jq '.[0].databaseId')

if [ -z "$RUN_ID" ]; then
    echo "Actions 실행을 찾을 수 없습니다."
    exit 1
fi

echo "최근 실행: $RUN_ID"

STATUS=$(gh run view "$RUN_ID" \
    --repo "$REPO" \
    --json status \
    --jq '.status')

if [ "$STATUS" != "completed" ]; then
    echo "아직 Actions가 실행 중입니다."
    exit 0
fi

CONCLUSION=$(gh run view "$RUN_ID" \
    --repo "$REPO" \
    --json conclusion \
    --jq '.conclusion')

echo "결과: $CONCLUSION"

if [ "$CONCLUSION" != "failure" ]; then
    echo "테스트 실패가 없습니다."
    exit 0
fi

echo "테스트 실패를 확인했습니다."
echo "로그 다운로드 중..."

rm -rf .github-logs
mkdir -p .github-logs

gh run download "$RUN_ID" \
    --repo "$REPO" \
    --name test-logs \
    --dir .github-logs

cp .github-logs/error.log ./error.log
cp .github-logs/analysis.log ./analysis.log

echo ""
echo "==================================="
echo "로그 다운로드 완료"
echo "==================================="
echo "error.log"
echo "analysis.log"