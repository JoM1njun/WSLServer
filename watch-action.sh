#!/bin/bash

REPO="JoM1njun/WSLServer"
WORKFLOW="AI Test Analysis"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

STATE_FILE="$SCRIPT_DIR/.last_run_id"
LOG_DIR="$SCRIPT_DIR/.github-logs"
ERROR_LOG="$SCRIPT_DIR/error.log"
ANALYSIS_LOG="$SCRIPT_DIR/analysis.log"

# 이전에 처리한 Run ID 불러오기
if [ -f "$STATE_FILE" ]; then
    LAST_RUN_ID=$(cat "$STATE_FILE")
else
    LAST_RUN_ID=""
fi

echo "==================================="
echo "GitHub Actions Watcher 시작"
echo "Repo: $REPO"
echo "Workflow: $WORKFLOW"
echo "Last Run ID: ${LAST_RUN_ID:-없음}"
echo "==================================="

echo "현재 작업 디렉터리: $(pwd)"
echo "Watcher 위치: $(dirname "$(realpath "$0")")"

while true
do
    RUN_ID=$(gh run list \
        --repo "$REPO" \
        --workflow "$WORKFLOW" \
        --limit 1 \
        --json databaseId \
        --jq '.[0].databaseId')

    if [ -z "$RUN_ID" ]; then
        echo "Actions 실행을 찾을 수 없습니다."
        sleep 30
        continue
    fi

    # 이미 처리한 Run이면 넘어감
    if [ "$RUN_ID" = "$LAST_RUN_ID" ]; then
        sleep 30
        continue
    fi

    echo "새로운 Actions 실행 발견"
    echo "Run ID: $RUN_ID"

    STATUS=$(gh run view "$RUN_ID" \
        --repo "$REPO" \
        --json status \
        --jq '.status')

    # 아직 실행 중이면 다음 확인 때 다시 확인
    if [ "$STATUS" != "completed" ]; then
        echo "Actions 실행 중..."
        sleep 30
        continue
    fi

    CONCLUSION=$(gh run view "$RUN_ID" \
        --repo "$REPO" \
        --json conclusion \
        --jq '.conclusion')

    echo "Actions 결과: $CONCLUSION"

    if [ "$CONCLUSION" = "failure" ]; then

        echo "테스트 실패 감지"
        echo "로그 다운로드 중..."

        rm -rf "$LOG_DIR"
        mkdir -p "$LOG_DIR"

        if gh run download "$RUN_ID" \
            --repo "$REPO" \
            --name test-logs \
            --dir "$LOG_DIR"
        then
            echo "Artifact 다운로드 성공"

            echo "현재 위치: $(pwd)"
            echo "===== 다운로드된 파일 ====="
            find "$LOG_DIR" -type f -print

            if [ -f "$LOG_DIR/error.log" ]; then
                cp "$LOG_DIR/error.log" "$ERROR_LOG"
                echo "error.log 복사 완료"
            fi

            if [ -f "$LOG_DIR/analysis.log" ]; then
                cp "$LOG_DIR/analysis.log" "$ANALYSIS_LOG"
                echo "analysis.log 복사 완료"
            fi

            echo "로그 다운로드 완료"
        else
            echo "Artifact 다운로드 실패"
            echo "다음 확인 때 다시 시도합니다."
            sleep 30
            continue
        fi
    fi

    # 여기까지 정상적으로 처리한 경우에만 저장
    echo "$RUN_ID" > "$STATE_FILE"
    LAST_RUN_ID="$RUN_ID"

    echo "처리 완료: $RUN_ID"
    echo "-----------------------------------"

    sleep 30
done