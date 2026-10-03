#!/bin/bash

REPO="JoM1njun/WSLServer"
WORKFLOW="AI Test Analysis"

LAST_RUN_ID=""

while true
do
    RUN_ID=$(gh run list \
        --repo "$REPO" \
        --workflow "$WORKFLOW" \
        --limit 1 \
        --json databaseId \
        --jq '.[0].databaseId')

    if [ -n "$RUN_ID" ] && [ "$RUN_ID" != "$LAST_RUN_ID" ]; then

        STATUS=$(gh run view "$RUN_ID" \
            --repo "$REPO" \
            --json status \
            --jq '.status')

        if [ "$STATUS" = "completed" ]; then

            CONCLUSION=$(gh run view "$RUN_ID" \
                --repo "$REPO" \
                --json conclusion \
                --jq '.conclusion')

            if [ "$CONCLUSION" = "failure" ]; then

                echo "테스트 실패 감지"
                echo "Run ID: $RUN_ID"

                rm -rf .github-logs
                mkdir -p .github-logs

                gh run download "$RUN_ID" \
                    --repo "$REPO" \
                    --name test-logs \
                    --dir .github-logs

                cp .github-logs/error.log ./error.log
                cp .github-logs/analysis.log ./analysis.log

                echo "로그 다운로드 완료"

            fi

            LAST_RUN_ID="$RUN_ID"
        fi
    fi

    sleep 30
done