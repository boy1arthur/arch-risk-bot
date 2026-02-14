import { AnalysisResult } from './analyzer.js';

/**
 * [The Eye] JS/TS Analysis Engine
 * 
 * RegEx-based static analysis for JavaScript/TypeScript files.
 * MVP: Focused on 8 specific credibility rules.
 */

export async function analyzeJsTsCode(code: string, fileName: string): Promise<AnalysisResult> {
    // 1. Architecture Health Scan (God Module / Large File)
    const lines = code.split('\n');
    if (lines.length > 800) {
        return {
            hasError: true,
            error: `Large File Risk: ${lines.length} lines. Maintanability risk.`,
            line: 1,
            type: 'ProductionRisk',
            file: fileName
        };
    }

    // 2. Risk Scan (Security & Production Readiness)
    const riskResult = scanForJsRisks(code, fileName, lines);
    if (riskResult.hasError) {
        return riskResult;
    }

    return { hasError: false };
}

interface RiskRule {
    pattern?: RegExp;
    condition?: (codeOrLine: string) => boolean;
    type: string;
    message: string;
}

function scanForJsRisks(code: string, fileName: string, lines: string[]): AnalysisResult {
    const risks: RiskRule[] = [
        // Critical (🔴) - Security
        {
            pattern: /eval\s*\(|new\s+Function\s*\(/,
            type: 'SecurityRisk',
            message: '[Security] Dynamic code execution detected (eval/new Function). This is a severe security risk.'
        },
        {
            pattern: /child_process\.(exec|execSync)\s*\(/,
            type: 'SecurityRisk',
            message: '[Security] Shell command execution detected. Ensure inputs are sanitized or use spawn without shell.'
        },
        {
            pattern: /spawn\s*\(.*,\s*\{.*shell:\s*true/s, // Multi-line match attempt with DOTALL flag simulated or just simple check
            type: 'SecurityRisk',
            message: '[Security] spawn with { shell: true } detected. This enables shell command injection.'
        },
        {
            pattern: /(?:api[._-]?key|password|secret|token)\s*[:=]\s*['"][a-zA-Z0-9_-]{10,}['"]/i,
            type: 'SecurityRisk',
            message: '[Security] Hardcoded secret detected. Use environment variables.'
        },

        // Warning (🟡) - Production Readiness
        {
            condition: (l) => /(axios(\.[a-z]+)?|fetch|http\.(get|request))\s*\(/.test(l) && !/timeout/.test(l),
            type: 'ProductionRisk',
            message: '[Reliability] HTTP call missing explicit timeout. This can cause cascading failures.'
        },
        // Heuristic: App listen but no global error handler (simplified: check for generic app.use((err... pattern)
        {
            condition: (c) => c.includes('app.listen') && !/app\.use\s*\(\s*\(\s*err/.test(c),
            type: 'ProductionRisk',
            message: '[Reliability] Express app detected but Global Error Handler missing. Unhandled errors may crash the server.'
        },
        {
            pattern: /console\.log\s*\(/,
            type: 'ProductionRisk',
            message: '[Observability] console.log used in production code. Use a structured logger (winston/pino).'
        }
    ];

    // Line-based checks
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const risk of risks) {
            // Pattern check
            if (risk.pattern && risk.pattern.test(line)) {
                // Skip comments for simple cases
                if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

                return {
                    hasError: true,
                    error: risk.message,
                    line: i + 1,
                    type: risk.type,
                    file: fileName
                };
            }

            // Line-based Condition check (special case for timeout)
            // We distinguish global vs line condition by context? 
            // The 'app.listen' check is clearly global (checks whole code).
            // The 'timeout' check is clearly line based (checks 'l').
            // Let's rely on the message content to know if it is line-based for MVP simplicity
            if (risk.condition && risk.message.includes('HTTP missing timeout') && risk.condition(line)) {
                if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
                return {
                    hasError: true,
                    error: risk.message,
                    line: i + 1,
                    type: risk.type,
                    file: fileName
                };
            }
        }
    }

    // File-based checks (Global patterns)
    for (const risk of risks) {
        // Global Condition check
        if (risk.condition && !risk.message.includes('HTTP missing timeout') && risk.condition(code)) {
            return {
                hasError: true,
                error: risk.message,
                line: 0,
                type: risk.type,
                file: fileName
            };
        }
        // Multi-line regex checks
        if (risk.pattern && risk.pattern.flags.includes('s') && risk.pattern.test(code)) {
            return {
                hasError: true,
                error: risk.message,
                line: 0,
                type: risk.type,
                file: fileName
            };
        }
    }

    return { hasError: false };
}
