#!/bin/bash

echo "WATCHER 실행됨" >> "$HOME/watcher-debug.log"

set -u

REPO="JoM1njun/WSLServer"
WORKFLOW="AI Test Analysis"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

LOG_DIR="$SCRIPT_DIR/.github-logs"
ERROR_LOG="$SCRIPT_DIR/error.log"
ANALYSIS_LOG="$SCRIPT_DIR/analysis.log"

log() {
    echo "[$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M:%S KST')] $1"
}

log "==================================="
log "GitHub Actions Watcher 시작"
log "Repo: $REPO"
log "Workflow: $WORKFLOW"
log "Watcher 위치: $SCRIPT_DIR"
log "==================================="


# -----------------------------------
# 1. 현재 Push한 Commit 확인
# -----------------------------------

COMMIT_SHA=$(git rev-parse HEAD)

log "Push Commit: $COMMIT_SHA"


# -----------------------------------
# 2. 해당 Commit의 Actions 실행 찾기
# -----------------------------------

RUN_ID=""

log "GitHub Actions 실행을 기다리는 중..."

while [ -z "$RUN_ID" ]
do
    RUN_ID=$(gh run list \
        --repo "$REPO" \
        --workflow "$WORKFLOW" \
        --limit 20 \
        --json databaseId,headSha \
        --jq ".[] | select(.headSha == \"$COMMIT_SHA\") | .databaseId" \
        | head -n 1
        )

    if [ -z "$RUN_ID" ]; then
        log "아직 Actions 실행이 생성되지 않았습니다."
        sleep 5
    fi
done

log "Actions 실행 발견"
log "Run ID: $RUN_ID"


# -----------------------------------
# 3. Actions 완료까지 대기
# -----------------------------------

while true
do
    STATUS=$(gh run view "$RUN_ID" \
        --repo "$REPO" \
        --json status \
        --jq '.status')

    log "Actions 상태: $STATUS"

    if [ "$STATUS" = "completed" ]; then
        break
    fi

    sleep 10
done


# -----------------------------------
# 4. Actions 결과 확인
# -----------------------------------

CONCLUSION=$(gh run view "$RUN_ID" \
    --repo "$REPO" \
    --json conclusion \
    --jq '.conclusion')

log "Actions 결과: $CONCLUSION"


# -----------------------------------
# 5. 결과 로그 다운로드
# -----------------------------------

log "테스트 결과 로그 다운로드 시작"

rm -rf "$LOG_DIR"
mkdir -p "$LOG_DIR"

if gh run download "$RUN_ID" \
    --repo "$REPO" \
    --name test-logs \
    --dir "$LOG_DIR"
then

    log "Artifact 다운로드 성공"

    echo "==================================="
    echo "다운로드된 파일"
    echo "==================================="

    find "$LOG_DIR" -type f -print


    # -----------------------------------
    # error.log 복사
    # -----------------------------------

    if [ -f "$LOG_DIR/error.log" ]; then
        cp "$LOG_DIR/error.log" "$ERROR_LOG"
        log "error.log 복사 완료"
    else
        log "error.log를 찾을 수 없습니다."
    fi


    # -----------------------------------
    # analysis.log 복사
    # -----------------------------------

    if [ -f "$LOG_DIR/analysis.log" ]; then
        cp "$LOG_DIR/analysis.log" "$ANALYSIS_LOG"
        log "analysis.log 복사 완료"
    else
        log "analysis.log를 찾을 수 없습니다."
    fi


    # -----------------------------------
    # 터미널에 로그 출력
    # -----------------------------------

    echo ""
    echo "==================================="
    echo "ERROR LOG"
    echo "==================================="

    if [ -f "$ERROR_LOG" ]; then
        cat "$ERROR_LOG"
    else
        echo "테스트 성공!"
        echo "error.log가 없습니다."
    fi


    echo ""
    echo "==================================="
    echo "AI ANALYSIS LOG"
    echo "==================================="

    if [ -f "$ANALYSIS_LOG" ]; then
        cat "$ANALYSIS_LOG"
    else
        echo "analysis.log가 없습니다."
    fi


    echo ""
    echo "==================================="
    log "로그 처리 완료"
    echo "==================================="

else

    log "Artifact 다운로드 실패"
    exit 1

fi


# -----------------------------------
# 6. 종료
# -----------------------------------

log "==================================="
log "Watcher 처리 완료"
log "Run ID: $RUN_ID"
log "==================================="

exit 0
