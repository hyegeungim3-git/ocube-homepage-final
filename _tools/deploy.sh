#!/usr/bin/env bash
# GitHub Pages 배포 — 루트 = 현재 public/, /vX.Y/ = 각 태그 시점 동결본
#
#   사용법:  bash _tools/deploy.sh
#
# 동작
#   1) 현재 커밋(HEAD)의 public/ 내용을 gh-pages 루트로
#   2) v* 태그마다 그 시점 public/ 을 /태그이름/ 하위에 동결 배치
#   3) gh-pages 를 매번 새로 만들어 force push (히스토리는 main 에만 남김)
#
# 새 버전을 동결하려면 태그만 찍으면 된다:
#   git tag -a v1.1 -m "설명" && git push origin v1.1 && bash _tools/deploy.sh
#
# git archive 로 "추적 중인 파일"만 복사하므로 로컬 임시 파일은 배포되지 않는다.
set -euo pipefail

cd "$(dirname "$0")/.."
REPO=$(pwd)
REMOTE=$(git remote get-url origin)

if [ -n "$(git status --porcelain)" ]; then
  echo "!! 커밋되지 않은 변경이 있습니다. 먼저 커밋하세요."
  git status --short
  exit 1
fi

OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT

echo "-- 루트: HEAD ($(git rev-parse --short HEAD))"
git archive HEAD public | tar -x -C "$OUT" --strip-components=1

for t in $(git tag -l 'v*' | sort -V); do
  echo "-- 동결본: /$t/"
  mkdir -p "$OUT/$t"
  git archive "$t" public | tar -x -C "$OUT/$t" --strip-components=1
done

cd "$OUT"
git init -q
git checkout -q -b gh-pages
git add -A
git -c user.email=deploy@local -c user.name=deploy \
    commit -q -m "deploy: root=$(cd "$REPO" && git rev-parse --short HEAD), frozen=[$(cd "$REPO" && git tag -l 'v*' | sort -V | tr '\n' ' ')]"
git push -qf "$REMOTE" gh-pages

echo "OK  루트 $(find . -maxdepth 1 -name '*.html' | wc -l)p / 동결 $(cd "$REPO" && git tag -l 'v*' | wc -l)개"
