# 📄 PR 코멘터 표준 템플릿 (v1)

리뷰어의 피로도를 줄이고 신뢰를 높이기 위해 짧고 강렬한 포맷을 유지합니다.

---

## 1. 헤더: 리스크 요약
> ### 🔍 Arch Risk Bot 분석 결과
> **발견된 잠재적 리스크: {{total_issues}}개**
> *이 봇은 코드를 자동으로 변경하지 않으며, 개선을 위한 제안만 제공합니다.*

---

## 2. 섹션: Risk List
- **[{{severity}}] {{title}}**
  - {{issue_summary}}

---

## 3. 섹션: Evidence
- **위치**: [{{file_path}}#L{{line_number}}](file_url)

---

## 4. 섹션: Patch Suggestion (Optional)
**💡 리팩토링 제안:**
```python
# {{suggestion_logic}}
{{fixed_code}}
```

---

## 5. 푸터
> ---
> **안내**:
> - 자동 변경 없음 (Suggestion 전용)
> - 재실행 방법: PR 업데이트 시 자동 재실행
> - 한계: 정적 분석 및 AI 추론 기반으로 실제 동작과 다를 수 있음
