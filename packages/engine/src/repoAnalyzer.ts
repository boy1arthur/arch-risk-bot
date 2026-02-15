import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { analyzePythonCode, AnalysisResult } from './analyzer.js';
import { analyzeJsTsCode } from './jsAnalyzer.js';
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
import { LOCALES } from './i18n/locales.js';

export function getAuditDetails(id: string, type: string, issue: string, lang: 'en' | 'ko' = 'en'): { id: string; title: string; category: RepoAnalysisResult['findings'][0]['category']; evidence: string; standard: string; impact: string; action: string; reference: string; whenItMatters: string } {
    const commonFields = { id };
    const messages = LOCALES[lang] || LOCALES['en'];
    let details: any = messages['DEFAULT'];

    if (messages[id as keyof typeof messages]) {
        details = messages[id as keyof typeof messages];
    } else if (type === 'SecurityRisk') { // Fallback for general security type if ID not matched
        details = messages['RR-SEC-001'];
    } else if (type === 'CircularDependency') {
        details = messages['RR-DEP-001'];
    } else if (type === 'GodModule') {
        details = messages['RR-LINT-001'];
    }

    return {
        ...commonFields,
        title: details.title,
        category: details.category as any,
        evidence: details.evidence || issue, // Use predefined evidence if exists, else dynamic issue
        standard: details.standard,
        impact: details.impact,
        action: details.action,
        reference: details.reference,
        whenItMatters: details.whenItMatters
    };
}

export async function analyzeRepository(repoPath: string, options?: { lang?: 'en' | 'ko', resultsDir?: string }): Promise<RepoAnalysisResult> {
    const lang = options?.lang || 'en';
    const resultsDir = options?.resultsDir;
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
        const details = getAuditDetails('RR-TEST-001', 'ProductionRisk', '', lang);
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
        const details = getAuditDetails('RR-CI-001', 'ProductionRisk', '', lang);
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
        const details = getAuditDetails('RR-OPS-001', 'ProductionRisk', evidenceBlock, lang);
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
                const details = getAuditDetails('RR-LINT-001', 'GodModule', `File length: ${lines.length} lines`, lang);
                findings.push({ file: relativePath, line: 0, type: 'ProductionRisk', ...details });
                operationalGapCount++;
            }

            const result = await analyzePythonCode(code, relativePath);

            if (result.hasError) {
                const details = getAuditDetails('RR-SEC-001', result.type || 'Error', result.error || 'Unknown Issue', lang);
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

    // 2.1 Code Level Analysis (JS/TS logic)
    for (const f of files.filter(f => /\.(js|ts|jsx|tsx)$/.test(f))) {
        try {
            const code = fs.readFileSync(f, 'utf8');
            const relativePath = path.relative(repoPath, f);

            // Logging Check (Simple console.log check is in rules, but here specific frameworks?)
            // We rely on rules for now.

            const result = await analyzeJsTsCode(code, relativePath);

            if (result.hasError) {
                const details = getAuditDetails('RR-SEC-002', result.type || 'Error', result.error || 'Unknown Issue', lang); // Use SEC-002 for JS? Or reuse.
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
        const details = getAuditDetails('RR-LOG-001', 'ProductionRisk', '', lang);
        findings.push({ file: 'Repository Root', line: 0, type: 'ProductionRisk', ...details });
        operationalGapCount++;
    }

    // 3. Dependency Scan (Scalability -15)
    const { adj, cycles } = depsScan(repoPath);
    for (const cycle of cycles) {
        const details = getAuditDetails('RR-DEP-001', 'CircularDependency', `Cycle: ${cycle.join(' -> ')}`, lang);
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
        disclosure: LOCALES[lang]?.DISCLOSURE || LOCALES['en'].DISCLOSURE,
        cta: LOCALES[lang]?.CTA || LOCALES['en'].CTA
    };
}
