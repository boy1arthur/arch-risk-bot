import chalk from 'chalk';
import path from 'path';
import { formatScore } from '../utils/format.js';

export async function runAudit(dir: string) {
    const targetDir = path.resolve(process.cwd(), dir);
    const provider = process.env.ARCHRISK_AI_PROVIDER;
    const apiKey = process.env.ARCHRISK_API_KEY;

    if (!apiKey) {
        console.error(chalk.red('\n❌ Error: AI API Key not found.'));
        console.log(chalk.yellow('Run ') + chalk.bold('archrisk config') + chalk.yellow(' to set up your provider and key.'));
        process.exit(1);
    }

    console.log(chalk.magenta(`\n🧠 Starting Architecture Deep Audit using ${provider}...`));
    console.log(chalk.gray('Analyzing architectural patterns and technical debt against production standards...\n'));

    try {
        const { runDeepAnalysis } = await import('archrisk-engine');
        const result = await runDeepAnalysis(targetDir, provider!, apiKey);

        console.log(chalk.green('\n✨ Architecture Deep Audit Complete!'));
        console.log(chalk.white('-----------------------------------------'));
        console.log(`${chalk.bold('Technical Debt Impact:')} ${formatScore(100 - result.techDebtScore)} / 100`);
        console.log(`${chalk.bold('Strategic Summary:')} ${result.summary}`);
        console.log(chalk.white('-----------------------------------------'));

        if (result.refactoringGuides.length > 0) {
            console.log(chalk.bold(`\n🛠 Architecture Refactoring Guides (${result.refactoringGuides.length}):`));
            result.refactoringGuides.forEach((g: any, i: number) => {
                console.log(`\n[${i + 1}] ${chalk.cyan(g.file)}`);
                console.log(`${chalk.yellow('Issue:')} ${g.description}`);
                console.log(`${chalk.green('Solution:')} ${g.suggestion}`);
            });
        }

        console.log(chalk.white('\n-----------------------------------------'));
        console.log(chalk.green.bold("\n✔ Ritual Complete"));
        console.log(chalk.gray("Recommendation: Run this audit monthly to keep technical debt in check.\n"));

    } catch (error: any) {
        console.error(chalk.red(`\nAudit failed: ${error.message}`));
        process.exit(1);
    }
}
