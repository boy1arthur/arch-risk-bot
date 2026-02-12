# 📋 배포 체크리스트 (MVP Phase)

MVP의 안정적인 운영을 위한 단일 배포처 설정 및 사전 점검 항목입니다.

## 1. 추천 배포처: Railway
- **이유**: Node.js/TypeScript 환경 설정이 매우 간단하며, Probot 서버 운영에 최적화됨.
- **설정**:
  - `Root Directory`: `apps/webhook`
  - `Build Command`: `pnpm build`
  - `Start Command`: `pnpm start`

## 2. 필수 환경 변수 (ENV)
배포 시 다음 변수가 반드시 설정되어야 합니다:
- `APP_ID`: GitHub App ID
- `PRIVATE_KEY`: GitHub App Private Key (Base64 encoding 권장)
- `WEBHOOK_SECRET`: GitHub Webhook Secret
- `GEMINI_API_KEY`: Google Gemini API Key
- `NODE_ENV`: `production`

## 3. 배포 전 최종 점검 (Pre-flight)
- [ ] `pnpm build`가 에러 없이 완료되는가?
- [ ] `.gitignore`에 `.env` 및 민감 정보가 제외되었는가?
- [ ] PR 코멘트 템플릿 v1이 `index.ts`에 정상 반영되었는가?
- [ ] 대규모 PR(20개 파일/2000라인) 차단 로직이 작동하는가?

## 4. 모니터링
- 배포처의 **Logs** 탭을 통해 GitHub Webhook 수신 여부 실시간 확인.
- AI 진단 타임아웃 발생 시 Sentry나 단순 로그로 트래킹 권장.
