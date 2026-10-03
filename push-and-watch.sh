#!/bin/bash

echo "Git push 시작..."

if git push; then
    echo "Git push 성공"
else
    echo "Git push 실패"
    exit 1
fi

echo "GitHub Actions watcher 시작..."

bash "$(dirname "$0")/watch-action.sh"