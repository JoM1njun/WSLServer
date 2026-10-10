
import json
import os
import re
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_FILE = ROOT_DIR / "change_context.json"

MAX_FILE_CHARS = 30_000
MAX_TOTAL_CHARS = 120_000

EXCLUDED_PARTS = {
    ".git",
    "node_modules",
    ".venv",
    "venv",
    "__pycache__",
    "dist",
    "build",
    "coverage",
}

EXCLUDED_NAMES = {
    ".env",
    ".env.local",
    ".env.production",
    "error.log",
    "analysis.log",
    "code_review.log",
    "change_context.json",
}

EXCLUDED_SUFFIXES = {
    ".pyc",
    ".pkl",
    ".pem",
    ".key",
    ".sqlite",
    ".db",
}

SECRET_PATTERNS = [
    re.compile(
        r'(?i)(api[_-]?key|access[_-]?token|'
        r'client[_-]?secret|password|passwd)'
        r'(\s*["\']?\s*[:=]\s*["\']?)[^\s,"\']+'
    ),
    re.compile(r"AIza[0-9A-Za-z_-]{20,}"),
    re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
]


def run_git(*args):
    result = subprocess.run(
        ["git", *args],
        cwd=ROOT_DIR,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=True,
    )
    return result.stdout


def redact(text):
    for pattern in SECRET_PATTERNS:
        if pattern.groups:
            text = pattern.sub(r"\1\2[REDACTED]", text)
        else:
            text = pattern.sub("[REDACTED]", text)
    return text


def should_exclude(path):
    file_path = Path(path)
    parts = set(file_path.parts)

    if parts & EXCLUDED_PARTS:
        return True

    if file_path.name.lower() in EXCLUDED_NAMES:
        return True

    if file_path.suffix.lower() in EXCLUDED_SUFFIXES:
        return True

    if file_path.name.lower().startswith(".env"):
        return True

    return False


def get_diff(base_sha, head_sha, path):
    return run_git(
        "diff",
        "--no-ext-diff",
        "--no-color",
        "--no-renames",
        "--unified=30",
        base_sha,
        head_sha,
        "--",
        path,
    )


def get_changed_files(base_sha, head_sha):
    output = run_git(
        "diff",
        "--name-status",
        "--find-renames",
        base_sha,
        head_sha,
    )

    changes = []

    for line in output.splitlines():
        fields = line.split("\t")

        if not fields:
            continue

        status = fields[0]

        if status.startswith("R") or status.startswith("C"):
            old_path, new_path = fields[1], fields[2]
            path = new_path
        else:
            old_path = None
            path = fields[1]

        changes.append({
            "status": status,
            "path": path,
            "old_path": old_path,
        })

    return changes


def collect():
    base_sha = os.getenv("BASE_SHA", "").strip()
    head_sha = os.getenv("HEAD_SHA", "").strip()

    if not base_sha or not head_sha:
        raise ValueError("BASE_SHA와 HEAD_SHA가 필요합니다.")

    # 커밋이 실제로 존재하는지 확인
    run_git("cat-file", "-e", f"{base_sha}^{{commit}}")
    run_git("cat-file", "-e", f"{head_sha}^{{commit}}")

    changes = get_changed_files(base_sha, head_sha)
    collected = []
    total_chars = 0

    for change in changes:
        path = change["path"]

        if should_exclude(path):
            print(f"제외: {path}")
            continue

        diff = redact(get_diff(base_sha, head_sha, path))

        content = None
        file_in_head = run_git(
            "cat-file", "-e", f"{head_sha}:{path}"
        ) if False else None

        # 삭제된 파일은 현재 코드가 없으므로 diff만 수집
        exists_in_head = subprocess.run(
            ["git", "cat-file", "-e", f"{head_sha}:{path}"],
            cwd=ROOT_DIR,
            capture_output=True,
        ).returncode == 0

        if exists_in_head:
            try:
                content = run_git("show", f"{head_sha}:{path}")
                content = redact(content)
            except subprocess.CalledProcessError:
                content = None

        if content is not None and len(content) > MAX_FILE_CHARS:
            content = content[:MAX_FILE_CHARS] + "\n[파일 내용 일부 생략]"

        remaining = MAX_TOTAL_CHARS - total_chars

        if remaining <= 0:
            print("전체 수집 용량 제한에 도달했습니다.")
            break

        diff = diff[:remaining]
        total_chars += len(diff)

        if content is not None:
            remaining = MAX_TOTAL_CHARS - total_chars
            content = content[:max(0, remaining)]
            total_chars += len(content)

        collected.append({
            **change,
            "diff": diff,
            "content": content,
        })

    payload = {
        "base_sha": base_sha,
        "head_sha": head_sha,
        "changed_files": collected,
    }

    OUTPUT_FILE.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"변경 파일 수: {len(collected)}")
    print(f"수집 결과 저장: {OUTPUT_FILE}")


if __name__ == "__main__":
    collect()
