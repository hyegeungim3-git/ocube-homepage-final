# 버전 관리

사이트 소스는 `public/` 이며, `main` 브랜치가 항상 **최신 작업본**입니다.

| 버전 | 라이브 주소 | 내용 |
|---|---|---|
| 최신(main) | https://hyegeungim3-git.github.io/ocube-homepage-final/ | 계속 갱신됨 |
| v1.0 | https://hyegeungim3-git.github.io/ocube-homepage-final/v1.0/ | 2026-07-27 동결본 (23페이지, css codex-36 / js codex-11) |

## 규칙

- **main = 라이브 루트.** 수정하면 배포 시 바로 반영됩니다.
- **태그 = 동결본.** `v*` 태그를 찍으면 그 시점 화면이 `/태그이름/` 주소로 영구 보존됩니다.
- 동결본은 손대지 않습니다. 되돌릴 일이 생기면 태그에서 복원합니다.

## 새 버전 동결 + 배포

```bash
cd 홈페이지_시안/codex
git add public && git commit -m "..."
git tag -a v1.1 -m "무엇이 달라졌는지"
git push origin main && git push origin v1.1
bash _tools/deploy.sh
```

태그 없이 수정만 반영할 때는 커밋·푸시 후 `bash _tools/deploy.sh` 만 실행하면 됩니다.

## 특정 버전으로 되돌리기

```bash
git checkout v1.0 -- public   # v1.0 화면을 작업본으로 복원
```

## v1.0 시점 요약 (2026-07-27)

- 23페이지 / GNB 대메뉴 4종(Business·Solution·Global Partners·Company, 비클릭 메가 메뉴)
- Notion 라이트 테마 + 자연 스크롤, 히어로 풀스크린
- 솔루션 7페이지 = HERO 문구가 스크롤에 따라 소개 영역으로 이동하는 구조
- Embedded = 완성차 로고 마퀴 + 3대 핵심 역량 + 보안 4섹션 병합본
- 시연 영상 2종(QAgent·Qdrive) 적용
