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

            for (const file of files) {
                if (file.filename.endsWith(".py") && (file.status === "added" || file.status === "modified")) {
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

                            // 5. Post comment
                            const commentBody = `
### 🚩 아키텍처/코드 위험 감지: ${file.filename}

**위험 수준**: ${diagnosis.severity === "error" ? "🔴 Error" : "🟠 Warning"}
**문제**: ${diagnosis.issue}

**💡 제안**:
${diagnosis.suggestion}

**🛠️ 리팩토링 패치**:
\`\`\`python
${diagnosis.fixedCode}
\`\`\`
              `;

                            await context.octokit.issues.createComment(
                                context.issue({
                                    body: commentBody,
                                })
                            );
                        }
                    }
                }
            }

            // 6. Architecture Health Summary (Basic)
            const { data: prData } = await context.octokit.pulls.get({
                owner,
                repo,
                pull_number: number,
            });

            const totalChanges = prData.changed_files;
            if (totalChanges > 20) {
                await context.octokit.issues.createComment(
                    context.issue({
                        body: `
### ⚠️ 아키텍처 주의: 대규모 변경 감지
이 PR은 **${totalChanges}개**의 파일을 변경하고 있습니다. 
대규모 PR은 리뷰가 어렵고 설계 의도를 파악하기 힘들 수 있습니다. 
가능하다면 작은 단위로 쪼개는 것을 권장합니다.
            `,
                    })
                );
            }
        } catch (error: any) {
            app.log.error(`Error during analysis: ${error.message}`);
        }
    });
};
