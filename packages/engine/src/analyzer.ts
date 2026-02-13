import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

/**
 * [The Eye] Error Capture Engine (TypeScript Version)
 * 
 * Intercepts Python syntax/runtime errors.
 */

export interface AnalysisResult {
    hasError: boolean;
    error?: string;
    line?: number;
    type?: string;
    file?: string;
}

/**
 * Analyze Python code string for syntax errors and security risks
 * @param code - Python source code
 * @param fileName - Original filename for context
 */
export async function analyzePythonCode(code: string, fileName: string): Promise<AnalysisResult> {
    // 1. Risk Scan (Simple Regex based for MVP)
    const riskResult = scanForRisks(code, fileName);
    if (riskResult.hasError) {
        return riskResult;
    }

    // 2. Syntax Check
    const tempFilePath = path.join(tmpdir(), `arch_risk_${randomBytes(4).toString('hex')}_${fileName}`);

    try {
        fs.writeFileSync(tempFilePath, code);

        return new Promise((resolve) => {
            const proc = spawn('python3', ['-m', 'py_compile', tempFilePath]);

            let stderr = '';
            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            proc.on('close', (code) => {
                if (code !== 0) {
                    const errorInfo = parseErrorMessage(stderr, fileName);
                    resolve({
                        hasError: true,
                        ...errorInfo
                    });
                } else {
                    resolve({ hasError: false });
                }

                // Cleanup temp file
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            });

            setTimeout(() => {
                proc.kill();
                resolve({ hasError: false, error: 'Analysis timeout' });
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            }, 5000);
        });
    } catch (error: any) {
        return { hasError: true, error: error.message };
    }
}

function scanForRisks(code: string, fileName: string): AnalysisResult {
    const risks = [
        { pattern: /os\.system\(/, type: 'SecurityRisk', message: 'Insecure use of os.system() detected. Use subprocess.run() with shell=False instead.' },
        { pattern: /subprocess\.(popen|run|call|check_output)\(.*shell\s*=\s*True/, type: 'SecurityRisk', message: 'Insecure use of subprocess with shell=True detected.' },
        { pattern: /eval\(/, type: 'SecurityRisk', message: 'Use of eval() detected, which can execute arbitrary code.' },
        { pattern: /exec\(/, type: 'SecurityRisk', message: 'Use of exec() detected, which can execute arbitrary code.' },
    ];

    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
        for (const risk of risks) {
            if (risk.pattern.test(lines[i])) {
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

    return { hasError: false };
}

function parseErrorMessage(stderr: string, fileName: string) {
    const lineMatch = stderr.match(/line (\d+)/);
    const typeMatch = stderr.match(/(\w+Error):/);

    return {
        error: stderr.trim(),
        line: lineMatch ? parseInt(lineMatch[1]) : undefined,
        type: typeMatch ? typeMatch[1] : 'SyntaxError',
        file: fileName
    };
}
