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
    // 1. Architecture Health Scan (God Module / Large File)
    const lines = code.split('\n');
    if (lines.length > 800) {
        return {
            hasError: true,
            error: `Large File Risk: ${lines.length} lines. 이 파일의 수정은 시스템 전반에 예측 불가능한 영향을 미칠 수 있습니다.`,
            line: 1,
            type: 'ProductionRisk',
            file: fileName
        };
    }

    // 2. Risk Scan (Operational & Production Readiness)
    const riskResult = scanForRisks(code, fileName);
    if (riskResult.hasError) {
        return riskResult;
    }

    // 3. Syntax Check
    const flatFileName = fileName.replace(/[\/\\]/g, '_');
    const tempFilePath = path.join(tmpdir(), `arch_risk_${randomBytes(4).toString('hex')}_${flatFileName}`);

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
        { pattern: /os\.system\(/, type: 'SecurityRisk', message: '[보안] os.system() 사용이 감지되었습니다. 외부 공격에 노출될 위험이 있습니다.' },
        { pattern: /subprocess\.(popen|run|call|check_output)\(.*shell\s*=\s*True/, type: 'SecurityRisk', message: '[보안] shell=True 옵션은 명령어 주입 공격의 통로가 될 수 있습니다.' },
        { pattern: /eval\(|exec\(/, type: 'SecurityRisk', message: '[보안] 동적 코드 실행 함수 사용은 잠재적인 보안 홀을 형성합니다.' },
        { pattern: /requests\.(get|post|put|delete|patch)\((?!.*timeout=)/, type: 'ProductionRisk', message: '[운영] 외부 API 호출 시 timeout 설정이 없습니다. 장애 발생 시 서비스가 무한 대기에 빠질 수 있습니다.' },
        { pattern: /aiohttp\.ClientSession\(\).*(get|post|put|delete|patch)\((?!.*timeout=)/, type: 'ProductionRisk', message: '[운영] 비동기 호출 시 timeout 설정이 없습니다. 시스템 리소스 고갈의 원인이 됩니다.' },
        { pattern: /(?:api_key|password|secret|token)\s*=\s*['"][a-zA-Z0-9_-]{10,}['"]/, type: 'ProductionRisk', message: '[운영] 민감 정보(API Key/Password)가 코드 내에 하드코딩 되어 있습니다. 보안 사고의 직접적인 원인입니다.' },
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
