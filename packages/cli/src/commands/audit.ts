import chalk from 'chalk';
import path from 'path';
import { formatScore } from '../utils/format.js';
import { t } from '../i18n/index.js';

export async function runAudit(dir: string) {
    const targetDir = path.resolve(process.cwd(), dir);
    const provider = process.env.ARCHRISK_AI_PROVIDER;
    const apiKey = process.env.ARCHRISK_API_KEY;

    if (!apiKey) {
        console.error(chalk.red('\n❌ Error: AI API Key not found.'));
        console.log(chalk.yellow('Run ') + chalk.bold('archrisk config') + chalk.yellow(' to set up your provider and key.'));
        process.exit(1);
    }

    console.log(chalk.magenta(`\n🧠 ${t("audit.start", { provider: provider || 'AI' })}`));
    console.log(chalk.gray(t("audit.analyze") + '\n'));

    try {
        const { runDeepAnalysis } = await import('archrisk-engine');
        const result = await runDeepAnalysis(targetDir, provider!, apiKey);

        console.log(chalk.green(`\n✨ ${t("audit.complete")}`));
        console.log(chalk.white('-----------------------------------------'));
        console.log(`${chalk.bold(t("audit.debt_impact") + ':')} ${formatScore(100 - result.techDebtScore)} / 100`);
        console.log(`${chalk.bold(t("audit.summary") + ':')} ${result.summary}`);
        console.log(chalk.white('-----------------------------------------'));

        if (result.refactoringGuides.length > 0) {
            console.log(chalk.bold(`\n🛠 ${t("audit.guides")} (${result.refactoringGuides.length}):`));
            result.refactoringGuides.forEach((g: any, i: number) => {
                console.log(`\n[${i + 1}] ${chalk.cyan(g.file)}`);
                console.log(`${chalk.yellow(t("audit.issue") + ':')} ${g.description}`);
                console.log(`${chalk.green(t("audit.solution") + ':')} ${g.suggestion}`);
            });
        }

        console.log(chalk.white('\n-----------------------------------------'));
        console.log(chalk.green.bold(`\n${t("header.complete")}`)); // Reusing header.complete as Ritual Complete
        console.log(chalk.gray(t("audit.recommendation") + '\n'));
        console.log(chalk.bold(`\n> ${t("footer.deploy_question")}\n`));

    } catch (error: any) {
        console.error(chalk.red(`\nAudit failed: ${error.message}`));
        process.exit(1);
    }
}
