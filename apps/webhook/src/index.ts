import { Probot } from "probot";
import { analyzePythonCode, diagnoseCodeError } from "@arch-risk-bot/engine";

export default (app: Probot) => {
    app.on(["pull_request.opened", "pull_request.synchronize"], async (context) => {
        const { owner, repo } = context.repo();
        const number = context.payload.pull_request.number;
        app.log.info(`Analyzing PR: ${owner}/${repo}#${number}`);

        try {
            // 1. Get changed files
            const { data: files } = await context.octokit.pulls.listFiles({
                owner,
                repo,
                pull_number: number,
            });

            // Guardrail: Max 20 files
            if (files.length > 20) {
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
                if (file.status !== "added" && file.status !== "modified") continue;

                app.log.info(`Analyzing Python file: ${file.filename}`);

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

                    // Guardrail: Skip deep analysis if total lines exceed 2,000
                    if (totalProcessedLines > 2000) {
                        app.log.warn("Total processed lines exceeded 2,000. Skipping deep analysis for remaining files.");
                        break;
                    }

                    // 3. Run analysis
                    const analysis = await analyzePythonCode(content, file.filename);

                    if (analysis.hasError && analysis.line) {
                        // 4. Diagnose error
                        const diagnosis = await diagnoseCodeError(
                            file.filename,
                            analysis.line,
                            analysis.type || "SyntaxError",
                            analysis.error || "Unknown error",
                            content
                        );

                        // 5. Post comment with New Template v1
                        const commentBody = `
### 🔍 Arch Risk Bot 분석 결과
**발견된 잠재적 리스크: 1개**
*이 봇은 코드를 자동으로 변경하지 않으며, 개선을 위한 제안만 제공합니다.*

---

**[${diagnosis.severity === "error" ? "🔴 Error" : "🟠 Warning"}] ${diagnosis.issue}**
- **문제 요약**: ${diagnosis.suggestion.split(".")[0]}.

**📍 Evidence**
- **위치**: [${file.filename}#L${analysis.line}](https://github.com/${owner}/${repo}/pull/${number}/files#diff-${Buffer.from(file.filename).toString("hex")}R${analysis.line})

**💡 리팩토링 제안 (Patch Suggestion)**
\`\`\`python
${diagnosis.fixedCode}
\`\`\`

---
> **안내**:
> - 자동 변경 없음 (Suggestion 전용)
> - 재실행 방법: PR 업데이트 시 자동 재실행
> - 한계: 정적 분석 및 AI 추론 기반으로 실제 동작과 다를 수 있음
            `;

                        await context.octokit.issues.createComment(
                            context.issue({
                                body: commentBody,
                            })
                        );
                    }
                }
            }
        } catch (error: any) {
            app.log.error(`Error during analysis: ${error.message}`);
        }
    });
};
