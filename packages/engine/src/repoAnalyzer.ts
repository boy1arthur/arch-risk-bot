import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { analyzePythonCode, AnalysisResult } from './analyzer.js';
import { depsScan } from './archScanner.js';

export interface RepoAnalysisResult {
    score: number; // Release Readiness Score (RRS)
    status: 'Ready for Production' | 'Needs Attention' | 'Not Ready for Deployment';
    findings: {
        id: string;
        title: string;
        file: string;
        line: number;
        type: string;
        category: 'Service Interruption' | 'Scalability' | 'Maintenance' | 'Security';
        evidence: string;
        standard: string;
        impact: string;
        action: string;
        reference: string;
        whenItMatters: string;
    }[];
    metrics: {
        totalFiles: number;
        pythonFiles: number;
        criticalRisks: number;
        operationalGaps: number;
    };
    graphUrl?: string;
    disclosure?: string;
    cta?: string;
}

/**
 * CEO-ready "Business Translation" for technical risks
 */
/**
 * 3-Tier Business Audit Translation
 */
/**
 * 3-Tier Business Audit Translation with Standard IDs
 */
export function getAuditDetails(id: string, type: string, issue: string): { id: string; title: string; category: RepoAnalysisResult['findings'][0]['category']; evidence: string; standard: string; impact: string; action: string; reference: string; whenItMatters: string } {
    const commonFields = { id };

    if (id === 'RR-SEC-001' || type === 'SecurityRisk') {
        return {
            ...commonFields,
            title: "보안 취약점 위험 (Security Vulnerability)",
            category: 'Security',
            evidence: issue,
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
        };
    }

    if (id === 'RR-TEST-001') {
        return {
            ...commonFields,
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
        };
    }

    if (id === 'RR-CI-001') {
        return {
            ...commonFields,
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
        };
    }

    if (id === 'RR-OPS-001') {
        return {
            ...commonFields,
            title: "운영 기본 위생 체크 실패 (Project Hygiene)",
            category: 'Service Interruption',
            evidence: issue, // Consolidated list will be passed here
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
        };
    }

    if (id === 'RR-LOG-001') {
        return {
            ...commonFields,
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
        };
    }

    if (id === 'RR-DEP-001' || type === 'CircularDependency') {
        return {
            ...commonFields,
            title: "구조적 의존성 결함 (Structural Dependency Issue)",
            category: 'Scalability',
            evidence: issue,
            standard: "Clean Architecture: Dependency Rule",
            impact: "모듈 간 결합도가 높아져 유지보수가 어려워지고, 사이드 이펙트가 발생하기 쉽습니다.",
            action: "상호 참조하는 모듈을 분리하거나 공통 모듈로 추출하세요.",
            reference: "https://refactoring.guru/design-patterns",
            whenItMatters: "프로젝트 규모가 커질수록 리팩토링 비용이 기하급수적으로 증가합니다."
        };
    }

    if (id === 'RR-LINT-001' || type === 'GodModule') {
        return {
            ...commonFields,
            title: "거대 모듈 감지 (God Module)",
            category: 'Maintenance',
            evidence: issue,
            standard: "Clean Code: Functions",
            impact: "단일 파일의 책임이 과도하여 변경 시 영향 범위를 예측하기 어렵습니다.",
            action: "책임에 따라 파일을 분리하세요 (Separation of Concerns).",
            reference: "https://pypi.org/project/flake8/",
            whenItMatters: "기능 추가 시마다 버그가 발생할 때."
        };
    }

    return {
        ...commonFields,
        title: "기타 잠재적 리스크 (Other Potential Risks)",
        category: 'Maintenance',
        evidence: issue,
        standard: "General Coding Best Practices",
        impact: "잠재적인 버그나 유지보수 어려움이 있을 수 있습니다.",
        action: "해당 코드를 리뷰하고 리팩토링을 고려하세요.",
        reference: "#",
        whenItMatters: "지속적인 코드 품질 저하가 우려될 때."
    };
}

export async function analyzeRepository(repoPath: string, resultsDir?: string): Promise<RepoAnalysisResult> {
    const files: string[] = [];
    const IGNORE_DIRS = ["node_modules", ".git", "dist", "build", "venv", ".venv", "__pycache__"];

    function walk(dir: string) {
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
        for (const ent of entries) {
            const full = path.join(dir, ent.name);
            if (ent.isDirectory()) {
                if (IGNORE_DIRS.includes(ent.name)) continue;
                walk(full);
            } else if (ent.isFile() && (ent.name.endsWith('.py') || ent.name.endsWith('.ts') || ent.name.endsWith('.js'))) {
                files.push(full);
            }
        }
    }

    walk(repoPath);

    const findings: RepoAnalysisResult['findings'] = [];
    let criticalCount = 0;
    let operationalGapCount = 0;

    // 1. Operational Audit (Critical -30 each)
    // 1. Operational Audit & Consolidation
    const hygieneMissing: string[] = [];

    // Check Tests
    const hasTests = fs.readdirSync(repoPath, { withFileTypes: true })
        .some(d => d.isDirectory() && /tests?|spec/i.test(d.name));
    if (!hasTests) {
        const details = getAuditDetails('RR-TEST-001', 'ProductionRisk', '');
        findings.push({
            file: 'Repository Root',
            line: 0,
            type: 'ProductionRisk',
            ...details
        });
        operationalGapCount++;
    }

    // Check CI
    const hasCI = fs.readdirSync(repoPath, { withFileTypes: true })
        .some(d => d.isDirectory() && /(\.github|\.circleci|jenkins|gitlab)/i.test(d.name));
    if (!hasCI) {
        const details = getAuditDetails('RR-CI-001', 'ProductionRisk', '');
        findings.push({
            file: 'Repository Root',
            line: 0,
            type: 'ProductionRisk',
            ...details
        });
        operationalGapCount++;
    }

    // Check Hygiene (Docker, Pinning, Env, GitIgnore)
    const allFiles = fs.readdirSync(repoPath);

    // Docker
    if (!allFiles.some(f => /Dockerfile|docker-compose/i.test(f))) {
        hygieneMissing.push("✘ Dockerfile or docker-compose.yml missing");
    }
    // Pinning
    if (!allFiles.some(f => /requirements\.txt|poetry\.lock|pyproject\.toml|package-lock\.json|pnpm-lock\.yaml/i.test(f))) {
        hygieneMissing.push("✘ Dependency Lockfile (requirements.txt, package-lock.json, etc) missing");
    }
    // Env
    if (!allFiles.some(f => /\.env\.example|\.env\.sample/i.test(f))) {
        hygieneMissing.push("✘ .env.example (Safe environment template) missing");
    }
    // GitIgnore
    if (!fs.existsSync(path.join(repoPath, '.gitignore'))) {
        hygieneMissing.push("✘ .gitignore missing");
    }

    if (hygieneMissing.length > 0) {
        const evidenceBlock = "\n" + hygieneMissing.join("\n");
        const details = getAuditDetails('RR-OPS-001', 'ProductionRisk', evidenceBlock);
        findings.push({
            file: 'Repository Root',
            line: 0,
            type: 'ProductionRisk',
            ...details
        });
        operationalGapCount++;
    }

    let hasLogging = false;

    // 2. Code Level Analysis (Python logic)
    for (const f of files.filter(f => f.endsWith('.py'))) {
        try {
            const code = fs.readFileSync(f, 'utf8');
            const lines = code.split('\n');
            const relativePath = path.relative(repoPath, f);

            // Logging Check
            if (code.includes('import logging') || code.includes('from loguru import logger')) {
                hasLogging = true;
            }

            // God Module Check (>500 lines)
            if (lines.length > 500) {
                const details = getAuditDetails('RR-LINT-001', 'GodModule', `File length: ${lines.length} lines`);
                findings.push({ file: relativePath, line: 0, type: 'ProductionRisk', ...details });
                operationalGapCount++;
            }

            const result = await analyzePythonCode(code, relativePath);

            if (result.hasError) {
                const details = getAuditDetails('RR-SEC-001', result.type || 'Error', result.error || 'Unknown Issue');
                findings.push({
                    file: relativePath,
                    line: result.line || 0,
                    type: result.type || 'Error',
                    ...details
                });

                if (result.type === 'SecurityRisk') criticalCount++;
            }
        } catch (e) {
            console.error(`Error analyzing ${f}:`, e);
        }
    }

    if (!hasLogging && files.filter(f => f.endsWith('.py')).length > 0) {
        const details = getAuditDetails('RR-LOG-001', 'ProductionRisk', '');
        findings.push({ file: 'Repository Root', line: 0, type: 'ProductionRisk', ...details });
        operationalGapCount++;
    }

    // 3. Dependency Scan (Scalability -15)
    const { adj, cycles } = depsScan(repoPath);
    for (const cycle of cycles) {
        const details = getAuditDetails('RR-DEP-001', 'CircularDependency', `Cycle: ${cycle.join(' -> ')}`);
        findings.push({
            file: cycle[0],
            line: 0,
            type: 'CircularDependency',
            ...details
        });
    }

    // 4. Scoring Logic (PRS: Production Readiness Score)
    // Max score is 95. Perfect project doesn't exist.
    let score = 95;
    score -= operationalGapCount * 30; // Critical operational gaps
    score -= criticalCount * 45;       // Security risks
    score -= cycles.length * 15;      // Structural issues
    score = Math.max(0, score);

    let status: RepoAnalysisResult['status'] = 'Ready for Production';
    if (score < 70) status = 'Not Ready for Deployment';
    else if (score < 90) status = 'Needs Attention';

    // 5. Visualization
    let graphUrl = "";
    if (resultsDir && fs.existsSync(resultsDir)) {
        const scanId = `graph_${Date.now()}`;
        const outputImgPath = path.join(resultsDir, `${scanId}.png`);
        const configPath = path.join(resultsDir, `${scanId}.json`);

        const edges: [string, string][] = [];
        adj.forEach((targets, source) => {
            targets.forEach(target => edges.push([source, target]));
        });

        const config = { edges, cycles, output_path: outputImgPath };
        fs.writeFileSync(configPath, JSON.stringify(config));

        try {
            const toolsDir = path.resolve(process.cwd(), "..", "..", "tools");
            const visualizerPath = path.join(toolsDir, "visualizer.py");
            execSync(`python3 ${visualizerPath} ${configPath}`);
            graphUrl = `/results/${scanId}.png`;
        } catch (e: any) {
            console.error("Visualization failed:", e.message);
        }
    }

    return {
        score,
        status,
        findings,
        metrics: {
            totalFiles: files.length,
            pythonFiles: files.filter(f => f.endsWith('.py')).length,
            criticalRisks: criticalCount,
            operationalGaps: operationalGapCount
        },
        graphUrl,
        disclosure: `배포 전 감사가 완료되었습니다. 발견된 리스크들은 실제 운영 환경에서 예기치 못한 서비스 중단이나 데이터 손실을 야기할 수 있는 항목들입니다.`,
        cta: `배포 루틴 자동화를 위해 GitHub App을 설치하고 지속적인 배포 준비도(Release Readiness)를 관리하세요.`
    };
}
