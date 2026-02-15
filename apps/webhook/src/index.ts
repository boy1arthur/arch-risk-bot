import { Probot } from "probot";
import { analyzePythonCode, diagnoseCodeError } from "archrisk-engine";

export default (app: Probot) => {
    app.log.info(`[ArchRiskBot] Webhook Path: ${process.env.WEBHOOK_PATH || '/'}`);
    app.log.info(`[ArchRiskBot] Gemini API Key present: ${!!process.env.GEMINI_API_KEY}`);
    app.on(["pull_request.opened", "pull_request.synchronize"], async (context) => {
        const { owner, repo } = context.repo();
        const number = context.payload.pull_request.number;
        app.log.info(`[ArchRiskBot] Analyzing PR: ${owner}/${repo}#${number}`);

        try {
            // 1. Get changed files
            const { data: files } = await context.octokit.pulls.listFiles({
                owner,
                repo,
                pull_number: number,
            });

            app.log.info(`[ArchRiskBot] Found ${files.length} changed files`);

            // Guardrail: Max 20 files
            if (files.length > 20) {
                app.log.warn(`[ArchRiskBot] Large PR detected (${files.length} files). Posting warning.`);
                await context.octokit.issues.createComment(
                    context.issue({
                        body: `### ⚠️ 대규모 변경 감지 (파일 ${files.length}개)\n변경 사항이 너무 많아 요약 분석만 수행합니다. 구조적 리스크를 줄이기 위해 PR을 작게 나누는 것을 권장합니다.`,
                    })
                );
            }

            const IGNORE_DIRS = ["node_modules/", "dist/", "build/", "vendor/", ".venv/", "env/", "generated/"];
            let totalProcessedLines = 0;

            for (const file of files) {
                // Guardrail: Skip ignored directories and non-python files
                if (IGNORE_DIRS.some(dir => file.filename.includes(dir))) continue;
                if (!file.filename.endsWith(".py")) continue;
                if (file.status !== "added" && file.status !== "modified") {
                    app.log.info(`[ArchRiskBot] Skipping file ${file.filename} with status ${file.status}`);
                    continue;
                }

                app.log.info(`[ArchRiskBot] Processing Python file: ${file.filename}`);

                // 2. Fetch file content
                const { data: contentData } = await context.octokit.repos.getContent({
                    owner,
                    repo,
                    path: file.filename,
                    ref: context.payload.pull_request.head.sha,
                });

                if ("content" in contentData && !Array.isArray(contentData)) {
                    const content = Buffer.from(contentData.content, "base64").toString("utf-8");
                    const linesCount = content.split("\n").length;
                    totalProcessedLines += linesCount;

                    app.log.info(`[ArchRiskBot] File ${file.filename} has ${linesCount} lines (Total: ${totalProcessedLines})`);

                    // Guardrail: Skip deep analysis if total lines exceed 2,000
                    if (totalProcessedLines > 2000) {
                        app.log.warn("[ArchRiskBot] Total processed lines exceeded 2,000. Skipping deep analysis for remaining files.");
                        break;
                    }

                    // 3. Run analysis
                    app.log.info(`[ArchRiskBot] Running engine analysis for ${file.filename}`);
                    const analysis = await analyzePythonCode(content, file.filename);

                    if (analysis.hasError && analysis.line) {
                        app.log.info(`[ArchRiskBot] Error/Risk detected in ${file.filename} at line ${analysis.line}`);

                        // 4. Diagnose error
                        app.log.info(`[ArchRiskBot] Calling AI diagnosis for ${file.filename}`);
                        const diagnosis = await diagnoseCodeError(
                            file.filename,
                            analysis.line,
                            analysis.type || "SyntaxError",
                            analysis.error || "Unknown error",
                            content
                        );

                        app.log.info(`[ArchRiskBot] Diagnosis complete. Confidence: ${diagnosis.confidence}`);

                        // 5. Post comment with Architecture Guardrail Template v1
                        const riskEmoji = analysis.type === 'ArchitectureRisk' ? '🏗️' : '🛡️';
                        const commentBody = `
### ${riskEmoji} Architecture Guardrail 분석 결과
**발견된 잠재적 리스크: 1개**
*이 봇은 아키텍처의 구조적 안정성을 유지하고 기술 부채의 폭발을 방지하는 가드레일 역할을 합니다.*

---

**[${diagnosis.severity === "error" ? "🔴 Critical" : "🟠 Warning"}] ${diagnosis.issue}**
- **문제 요약**: ${diagnosis.suggestion.split(".")[0]}.

**📍 Evidence**
- **위치**: [${file.filename}#L${analysis.line}](https://github.com/${owner}/${repo}/pull/${number}/files#diff-${Buffer.from(file.filename).toString("hex")}R${analysis.line})
- **유형**: ${analysis.type || "SyntaxError"}

**💡 아키텍처 개선 제안 (Structural Suggestion)**
\`\`\`python
${diagnosis.fixedCode}
\`\`\`

---
> **안내**:
> - **가드레일 목적**: 대규모 레거시 붕괴 방지 및 모듈화 유지
> - **재실행**: PR 업데이트 시 자동 재실행
> - **한계**: 정적 분석 기반으로 아키텍처 방향성에 대한 인사이트를 제공합니다.
            `;

                        await context.octokit.issues.createComment(
                            context.issue({
                                body: commentBody,
                            })
                        );
                        app.log.info(`[ArchRiskBot] Posted comment for ${file.filename}`);
                    } else {
                        app.log.info(`[ArchRiskBot] No errors/risks found in ${file.filename}`);
                    }
                }
            }
        } catch (error: any) {
            app.log.error(`[ArchRiskBot] Error during analysis: ${error.message}`);
        }
    });
};
