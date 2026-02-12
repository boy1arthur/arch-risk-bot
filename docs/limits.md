# 🚫 분석 제한 및 무시 규칙 (Guardrails)

비용 폭발 방지, 성능 유지, 그리고 GitHub API 레이트리밋 대응을 위한 가이드라인입니다.

## 1. 분석 범위 제한
- **최대 변경 파일 수**: 20개 (초과 시 요약 경고만 출력)
- **최대 변경 라인 수**: 2,000줄 (초과 시 정밀 분석 생략)
- **파일당 최대 크기**: 1MB 이하

## 2. 무시 디렉토리 (Ignore List)
다음 폴더 내의 파일은 분석에서 완전히 제외됩니다:
- `node_modules/`
- `dist/`, `build/`, `out/`
- `.venv/`, `env/`, `venv/`, `virtualenv/`
- `vendor/`
- `generated/`
- `.git/`, `.turbo/`, `.next/`

## 3. 무시 파일 패턴
- 바이너리 파일: `.exe`, `.dll`, `.so`, `.pyc`, `.pyo`, `.png`, `.jpg`, `.pdf` 등
- 설정 파일: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`
- 대규모 자동 생성 데이터: `*.min.js`, `*.map`

## 4. 안전 장치 (Fail-safe)
- AI 진단 타임아웃: 요청당 최대 10초
- API 레이트리밋 감지 시 즉시 중단 및 로그 기록
