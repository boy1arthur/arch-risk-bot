<img width="178" height="78" alt="image" src="https://github.com/user-attachments/assets/ca5ebd03-9789-48a1-ae0c-528d9bfa99e9" />


🌐 **공식 웹사이트**: [https://boy1arthur.github.io/arch-risk-bot](https://boy1arthur.github.io/arch-risk-bot)

### 배포 전 마지막 질문.Final Question Before Deploy

> **Would you deploy this today? 🚀**

AI 코드, 급한 핫픽스, 테스트 안 된 변경사항.  
배포 버튼을 누르기 전에 단 한 번 실행하세요.

```bash
npx archrisk check .
```

✅ **설치 없음** · **로컬 실행** · **무료 정적 진단** · **30초 결과**

---

### 🚀 First Users Thread

👉 **archrisk 돌려봤다면 점수를 공유해주세요**  
[https://github.com/boy1arthur/arch-risk-bot/issues/1](https://github.com/boy1arthur/arch-risk-bot/issues/1)

우리는 지금 실제 프로젝트 데이터를 수집 중입니다.

---

## 🎯 What is archrisk?

**archrisk**는 **Code Release Readiness Platform**입니다.  
단순 코드 품질 검사 도구가 아니라, **배포 전에 실행하는 의식(Pre-Deploy Ritual)**을 만드는 도구입니다.

배포 직전에 팀이 서로 묻기 시작하게 만드는 것이 목표입니다.

> *“archrisk 돌렸어?”*

---

## ⚡ Quick Start

### 1️⃣ 무료 배포 준비도 점검 (LLM 사용 없음)
```bash
npx archrisk check .
```

✔ **설치 필요 없음**  
✔ **API 비용 0원**  
✔ **코드 서버 전송 없음 (로컬 분석)**

**결과 예시:**
```text
Release Readiness Score: 45 / 95 🟡

Risk detected:
• [RR-CI-001] CI/CD pipeline missing
• [RR-TEST-001] No automated tests found
• [RR-LOG-001] Logging not configured
```

---

### 🧠 AI 심층 감사 (선택)

개인의 API 키를 사용하여 더 깊은 분석 가능.

```bash
npx archrisk config
npx archrisk audit .
```

이 단계에서만 AI가 사용됩니다.  
👉 **BYOK (Bring Your Own Key)**  
우리는 당신의 API를 사용하지 않습니다.

---

## 🧪 Production Readiness 11

**archrisk**는 실제 운영 장애를 유발하는 핵심 지표만 검사합니다.

| 영역 | 점검 항목 |
| :--- | :--- |
| **Delivery** | CI/CD 존재 여부 |
| **Testing** | 자동화 테스트 |
| **Observability** | 로깅 / 에러 핸들링 |
| **Architecture** | 순환 의존성 |
| **Maintainability** | 거대 모듈 |
| **Security** | 위험 함수 사용 |
| **Config** | 환경설정 분리 |
| **Reliability** | 장애 복구 준비 |
| **Scaling** | 구조적 병목 |
| **Documentation** | 배포 가이드 |
| **DevOps** | 자동화 수준 |

---

## 📜 Standardized Audit Report

모든 리스크는 동일한 구조로 보고됩니다.

- **Title** — 리스크 명칭 (with ID)
- **Evidence** — 탐지 근거
- **Standard** — 업계 기준 (Official Docs)
- **Impact** — 비즈니스 영향
- **Action** — 해결 방법 (Copy-Paste Templates)
- **Reference** — 공식 문서 링크

AI에게 *“이거 괜찮냐?”* 물어보는 것과의 차이는 여기 있습니다.  
👉 **일관된 기준 + 즉시 실행 가능한 해결책**

---

## 🔒 Privacy First

**archrisk**는 기본적으로 **로컬 분석 도구**입니다.

🚫 **코드 업로드 없음**  
🚫 **계정 필요 없음**  
🚫 **추적 없음**

AI 심층 분석은 사용자의 API 키로만 실행됩니다.

---

## 🧭 Why this exists

대부분의 장애는 “복잡한 버그”가 아니라 **준비되지 않은 배포**에서 시작됩니다.

❌ 테스트 없음  
❌ CI 없음  
❌ 로그 없음  
❌ 환경 분리 없음  

그리고 배포는 진행됩니다.  
**archrisk**는 그 순간을 멈추기 위해 만들어졌습니다.

---

## 🌍 Roadmap

- [x] **Local CLI Ritual**
- [x] **BYOK AI Audit**
- [ ] **GitHub App** (PR 자동 점검)
- [ ] **Release Readiness Certificate** (PDF)
- [ ] **Team Dashboard**

---

## ⭐ Support the Ritual

**archrisk**가 도움이 되었다면 **⭐ Star**를 눌러주세요.

그리고 실행해보세요.

```bash
npx archrisk check .
```

> **Would you deploy this today?**
