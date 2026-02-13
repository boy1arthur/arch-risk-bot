# 🗡️ 보검봇(ArchRisk Bot) 48시간 MVP 통합 상세 가이드

본 문서는 사장님이 전달해주신 세 가지 지시서(Gemini, GPT, Perplexity)를 하나로 통합한 최종 실행 매뉴얼입니다.

---

## 🎯 1. 북극성 지표 (North Star Metric)
**"Public URL 입력 후 30초 내에 '기술적 파산 점수'와 '충격적인 그래프'를 출력하여 공유를 유도한다."**

---

## 🏗️ 2. 시스템 아키텍처 (Monorepo Expansion)

```text
arch-risk-bot/
├─ apps/
│  ├─ webhook/      # 🛡️ 기존 GitHub App (수익 엔진/업셀용)
│  └─ scanner-api/  # ⭐ (NEW) 익명 URL 분석용 FastAPI/Express 서버
├─ packages/
│  └─ engine/       # ⚙️ (EXTEND) 리포지토리 전체 분석 로직 추가
└─ tools/           # 📊 (NEW) Python 그래프 생성 (networkx, matplotlib)
```

---

## 🛠️ 3. 핵심 모듈별 구현 상세

### P0. Scanner API (`apps/scanner-api`)
- **기능**: Shallow Clone (`--depth 1`) → 엔진 실행 → 결과 반환 → 즉시 삭제.
- **클린업**: `tmp` 라이브러리를 사용하여 분석 완료 후 반드시 폴더 삭제 (서버 자원 보호).

### P1. Health Score (정량 점수제)
- **기본 100점**에서 감점제 적용.
- **🔴 Critical (보안/설정)**: -30점
- **🟡 Warning (순환 의존성/거대 모듈)**: -15점
- **등급**: 90+(🟢), 70-89(🟡), 70 미만(🔴)

### P2. 시각화 - 아키텍처 맵 (`tools/generate_graph.py`)
- `networkx`와 `matplotlib`을 이용해 파일 간 `import` 관계 시각화.
- 순환 의존성(Cycle) 발견 시 해당 노드와 간선을 **빨간색**으로 강조.
- 결과 페이지 상단에 점수와 함께 배치하여 공유 욕구 자극.

### P3. CEO 언어 번역 (Business Mapping)
- "Circular Dependency" → **"수정 속도 10배 저하 위험"**
- "God Module" → **"한 명 퇴사 시 시스템 마비 위험"**

---

## 🗓️ 48시간 타임 테이블

### 🗓️ 1일차: 데이터 확보 및 엔진 안정화
- **Scanner API** 구축: Git Clone 및 분석 파이프라인 완성.
- **건강 점수 로직** 반영: `packages/engine`에 점수 산출 함수 구현.
- **그래프 생성기** 연동: Python 스크립트 호출 및 이미지 저장 로직.

### 🗓️ 2일차: 프론트엔드 및 바이럴 루프
- **랜딩 페이지**: 점수 + 그래프 + 신호등이 박힌 심플한 리포트 페이지.
- **공유 최적화**: Twitter/Slack용 OG 태그 및 점수 요약 이미지 자동 생성.
- **업셀 연결**: 페이지 하단에 "지속적인 관리는 GitHub App으로" CTA 배치.

---

## ⚠️ 실행 원칙 (The Lean Way)
1. **No DB**: 데이터베이스 설계에 1분도 쓰지 말 것. (세션으로 충분)
2. **Speed is Feature**: 무조건 30초 이내에 리포트 출력.
3. **Fear Marketing**: 개발자가 아닌 CTO/CEO가 "이거 큰일인데?"라고 느끼게 만들 것.

---
**"이제 말이 아닌 코드로 증명할 시간입니다. 48시간 뒤, 전 세계 모든 Python/Django 프로젝트의 건강검진을 시작합니다."**
