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
 * Analyze Python code string for syntax errors
 * @param code - Python source code
 * @param fileName - Original filename for context
 */
export async function analyzePythonCode(code: string, fileName: string): Promise<AnalysisResult> {
    const tempFilePath = path.join(tmpdir(), `arch_risk_${randomBytes(4).toString('hex')}_${fileName}`);

    try {
        fs.writeFileSync(tempFilePath, code);

        return new Promise((resolve) => {
            const proc = spawn('python', ['-m', 'py_compile', tempFilePath]);

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

function parseErrorMessage(stderr: string, fileName: string) {
    const lineMatch = stderr.match(/line (\d+)/);
    const typeMatch = stderr.match(/(\w+Error):/);

    return {
        error: stderr.trim(),
        line: lineMatch ? parseInt(lineMatch[1]) : undefined,
        type: typeMatch ? typeMatch[1] : 'UnknownError',
        file: fileName
    };
}
