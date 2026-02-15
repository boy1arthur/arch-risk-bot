
export const LOCALES = {
    en: {
        'RR-SEC-001': {
            title: "Security Vulnerability Detected",
            category: 'Security',
            standard: "OWASP Top 10 A03:2021 – Injection",
            impact: "Potential for unauthorized access or data leakage through injection attacks.",
            action: `
# Action: Isolate and use Environment Variables
subprocess.run(..., shell=False) # Recommended
# Or use .env file
import os
SECRET = os.getenv('MY_SECRET')
`,
            reference: "https://docs.python.org/3/library/subprocess.html#security-considerations",
            whenItMatters: "Immediately upon deployment, as scanners can detect this."
        },
        'RR-TEST-001': {
            title: "Missing Automated Tests",
            category: 'Service Interruption',
            evidence: "No tests/ directory or pytest/unittest configuration found.",
            standard: "pytest Framework Documentation",
            impact: "Unable to verify if validation logic breaks existing features. High risk of regression.",
            action: `
# Action: Create tests/test_smoke.py
def test_health_check():
    assert True  # Basic sanity check
`,
            reference: "https://docs.pytest.org/",
            whenItMatters: "When team size > 2 or deployment frequency increases."
        },
        'RR-CI-001': {
            title: "Missing CI Pipeline",
            category: 'Service Interruption',
            evidence: "No GitHub Actions (.github/workflows/*.yml) or CI configuration found.",
            standard: "GitHub Actions Documentation",
            impact: "Manual deployments are prone to human error and lack consistency.",
            action: `
# Action: Create .github/workflows/ci.yml
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test
`,
            reference: "https://docs.github.com/en/actions",
            whenItMatters: "When deploying more than twice a week."
        },
        'RR-OPS-001': {
            title: "Project Hygiene Check Failed",
            category: 'Service Interruption',
            standard: "12-Factor App / Docker Documentation",
            impact: "Inconsistency between dev and prod environments (\"It works on my machine\").",
            action: `
# Checklist to Fix:
1. Create 'Dockerfile'
2. Create '.gitignore' (use gitignore.io)
3. Create 'requirements.txt' or 'package.json'
4. Create '.env.example'
`,
            reference: "https://12factor.net/",
            whenItMatters: "Onboarding new members or migrating servers."
        },
        'RR-LOG-001': {
            title: "Insufficient Logging",
            category: 'Maintenance',
            evidence: "No logging configuration (logging, loguru) found in codebase.",
            standard: "Python Logging Cookbook",
            impact: "Zero visibility into runtime errors, making debugging impossible during outages.",
            action: `
# Action: Python Logging Setup
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("Server started")
`,
            reference: "https://docs.python.org/3/howto/logging-cookbook.html",
            whenItMatters: "When a 500 error occurs in production."
        },
        'RR-DEP-001': {
            title: "Structural Dependency Issue",
            category: 'Scalability',
            standard: "Clean Architecture: Dependency Rule",
            impact: "High coupling between modules makes maintenance difficult and increases side effects.",
            action: "Refactor to decouple modules or extract common logic.",
            reference: "https://refactoring.guru/design-patterns",
            whenItMatters: "As the codebase grows, refactoring costs explode."
        },
        'RR-LINT-001': {
            title: "God Module Detected",
            category: 'Maintenance',
            standard: "Clean Code: Functions",
            impact: "Single file has too many responsibilities, making changes risky.",
            action: "Split file based on responsibilities (Separation of Concerns).",
            reference: "https://pypi.org/project/flake8/",
            whenItMatters: "When every feature addition causes a regression bug."
        },
        'DEFAULT': {
            title: "Other Potential Risks",
            category: 'Maintenance',
            standard: "General Coding Best Practices",
            impact: "Potential bugs or maintenance debt.",
            action: "Review and consider refactoring.",
            reference: "#",
            whenItMatters: "When code quality starts to degrade."
        },
        'DISCLOSURE': "Pre-deploy audit complete. Detected risks may cause service interruptions or data loss in production.",
        'CTA': "Automate this ritual. Install the GitHub App to manage Release Readiness continuously."
    },
    ko: {
        'RR-SEC-001': {
            title: "보안 취약점 위험 (Security Vulnerability)",
            category: 'Security',
            standard: "OWASP Top 10 A03:2021 – Injection",
            impact: "외부 공격자가 시스템 권한을 탈취하거나 민감 정보를 유출할 수 있는 조건이 형성됩니다.",
            action: `
# Action: 격리 및 환경변수 사용
subprocess.run(..., shell=False) # 권장
# 또는 .env 파일 사용
import os
SECRET = os.getenv('MY_SECRET')
`,
            reference: "https://docs.python.org/3/library/subprocess.html#security-considerations",
            whenItMatters: "배포 즉시 자동화된 스캐너나 공격자에 의해 탐지될 수 있습니다."
        },
        'RR-TEST-001': {
            title: "자동화 테스트 부재 (Missing Automated Tests)",
            category: 'Service Interruption',
            evidence: "tests/ 디렉토리 또는 pytest/unittest 관련 설정을 찾을 수 없습니다.",
            standard: "pytest Framework Documentation",
            impact: "코드 변경 시 기존 기능이 파괴되었는지 확인할 방법이 없어, 배포 후 장애 발생 확률이 높아집니다.",
            action: `
# Action: Create tests/test_smoke.py
def test_health_check():
    assert True  # Basic sanity check
`,
            reference: "https://docs.pytest.org/",
            whenItMatters: "팀원이 2명 이상으로 늘어나거나 배포 주기가 빨라질 때."
        },
        'RR-CI-001': {
            title: "배포 자동화 파이프라인 부재 (Missing CI Pipeline)",
            category: 'Service Interruption',
            evidence: "GitHub Actions (.github/workflows/*.yml) 또는 CI 설정 파일이 없습니다.",
            standard: "GitHub Actions Documentation",
            impact: "사람의 수동 배포 과정에서 실수가 발생할 수 있으며, 일관된 배포 상태를 보장할 수 없습니다.",
            action: `
# Action: Create .github/workflows/ci.yml
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test
`,
            reference: "https://docs.github.com/en/actions",
            whenItMatters: "배포 빈도가 주 2회 이상으로 증가할 때."
        },
        'RR-OPS-001': {
            title: "운영 기본 위생 체크 실패 (Project Hygiene)",
            category: 'Service Interruption',
            standard: "12-Factor App / Docker Documentation",
            impact: "개발 환경과 운영 환경의 불일치로 인해 '내 컴퓨터에서는 되는데 서버에서는 안 되는' 문제가 발생합니다.",
            action: `
# Checklist to Fix:
1. Create 'Dockerfile'
2. Create '.gitignore' (use gitignore.io)
3. Create 'requirements.txt' or 'package.json'
4. Create '.env.example'
`,
            reference: "https://12factor.net/",
            whenItMatters: "신규 입사자 온보딩 또는 서버 이관 시."
        },
        'RR-LOG-001': {
            title: "로깅 설정 미흡 (Insufficient Logging)",
            category: 'Maintenance',
            evidence: "코드 내에서 로깅 설정(logging, loguru 등)이 발견되지 않았습니다.",
            standard: "Python Logging Cookbook",
            impact: "장애 발생 시 원인을 추적할 수 있는 데이터가 없어 해결 시간이 길어집니다.",
            action: `
# Action: Python Logging Setup
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("Server started")
`,
            reference: "https://docs.python.org/3/howto/logging-cookbook.html",
            whenItMatters: "운영 중 알 수 없는 500 에러가 발생했을 때."
        },
        'RR-DEP-001': {
            title: "구조적 의존성 결함 (Structural Dependency Issue)",
            category: 'Scalability',
            standard: "Clean Architecture: Dependency Rule",
            impact: "모듈 간 결합도가 높아져 유지보수가 어려워지고, 사이드 이펙트가 발생하기 쉽습니다.",
            action: "상호 참조하는 모듈을 분리하거나 공통 모듈로 추출하세요.",
            reference: "https://refactoring.guru/design-patterns",
            whenItMatters: "프로젝트 규모가 커질수록 리팩토링 비용이 기하급수적으로 증가합니다."
        },
        'RR-LINT-001': {
            title: "거대 모듈 감지 (God Module)",
            category: 'Maintenance',
            standard: "Clean Code: Functions",
            impact: "단일 파일의 책임이 과도하여 변경 시 영향 범위를 예측하기 어렵습니다.",
            action: "책임에 따라 파일을 분리하세요 (Separation of Concerns).",
            reference: "https://pypi.org/project/flake8/",
            whenItMatters: "기능 추가 시마다 버그가 발생할 때."
        },
        'DEFAULT': {
            title: "기타 잠재적 리스크 (Other Potential Risks)",
            category: 'Maintenance',
            standard: "General Coding Best Practices",
            impact: "잠재적인 버그나 유지보수 어려움이 있을 수 있습니다.",
            action: "해당 코드를 리뷰하고 리팩토링을 고려하세요.",
            reference: "#",
            whenItMatters: "지속적인 코드 품질 저하가 우려될 때."
        },
        'DISCLOSURE': "배포 전 감사가 완료되었습니다. 발견된 리스크들은 실제 운영 환경에서 예기치 못한 서비스 중단이나 데이터 손실을 야기할 수 있는 항목들입니다.",
        'CTA': "배포 루틴 자동화를 위해 GitHub App을 설치하고 지속적인 배포 준비도(Release Readiness)를 관리하세요。"
    }
};
