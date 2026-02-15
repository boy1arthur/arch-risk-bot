import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { analyzeRepository } from 'archrisk-engine';
import { formatScore, formatStatus } from '../utils/format.js';
import { t, currentLang } from '../i18n/index.js';

export async function runCheck(dir: string) {
    const targetDir = path.resolve(process.cwd(), dir);
    const lang = currentLang;

    console.log(chalk.cyan(t("header.running")));
    console.log(chalk.gray(t("scan.scanning_path", { path: targetDir }) + '\n'));

    if (!fs.existsSync(targetDir)) {
        console.error(chalk.red(`Error: Directory ${targetDir} does not exist.`));
        process.exit(1);
    }

    try {
        console.log(chalk.yellow(t("scan.static_engine")));
        // Pass language to engine for findings translation
        // The engine expects 'en' | 'ko'. detectSystemLang returns string, we might need casting or validation if stricter.
        // But detectSystemLang returns 'ko' or 'en'.
        const result = await analyzeRepository(targetDir, { lang: lang as 'en' | 'ko' });

        console.log(chalk.green(`\n${t("scan.audit_complete")}`));
        console.log(chalk.white('-----------------------------------------'));
        console.log(`${chalk.bold(t("score.label") + ':')} ${formatScore(result.score)} / 95`);
        console.log(`${chalk.bold(t("score.status") + ':')} ${formatStatus(result.status)}`);
        console.log(chalk.white('-----------------------------------------'));

        if (result.findings && result.findings.length > 0) {
            console.log(chalk.bold(`\n${t("findings.title")} (${result.findings.length}):`));
            result.findings.forEach((f: any, i: number) => {
                const idTag = f.id ? chalk.yellow(`[${f.id}] `) : '';
                console.log(`\n${chalk.gray(`[${i + 1}]`)} ${idTag}${chalk.bold.red(f.title)}`);
                console.log(`${chalk.gray(t("findings.file") + ':')} ${f.file}${f.line > 0 ? ` (Line ${f.line})` : ''}`);
                console.log(`${chalk.red('• ' + t("findings.evidence") + ':')} ${f.evidence}`);
                console.log(`${chalk.blue('• Standard:')} ${f.standard}`);
                console.log(`${chalk.yellow('• ' + t("findings.impact") + ':')} ${f.impact}`);

                console.log(`${chalk.green('• ' + t("findings.action") + ':')}`);
                if (f.action.includes('\n')) {
                    // Render multi-line templates with indentation for better readability
                    f.action.split('\n').forEach((line: string) => {
                        console.log(`  ${chalk.white(line)}`);
                    });
                } else {
                    console.log(`  ${f.action}`);
                }

                console.log(`${chalk.cyan('• Reference:')} ${f.reference}`);
                console.log(`${chalk.magenta('• When it becomes a real problem:')} ${f.whenItMatters}`);
            });
        } else {
            console.log(chalk.green(`\n${t("score.good")}`)); // Fallback if no specific "no risks" message in new JSON? 
            // User JSON didn't have "No Risks" message. Using "Good" or hardcoding for now?
            // "score": { "good": "Good" } is just a label. 
            // Let's use a safe fallback or add it to JSON if needed. User provided strictly JSON.
            // Wait, previous code had `ui.NoRisks`. User JSON lacks it. 
            // I will use `t("scan.audit_complete")` + Good for now to be safe or just keep English/Korean check.
            // Actually, I'll stick to the "Global Tool" vibe. "No significant risks found."
            // Since user didn't provide it, I'll hardcode or deduce.
            // Let's infer from `t("score.good")`.
            console.log(chalk.green(`\n✨ ${t("score.good")} - Ready for Production!`));
        }

        console.log(chalk.white('\n-----------------------------------------'));
        console.log(chalk.green.bold(`\n${t("header.complete")}`));

        console.log(chalk.blue(`\n${t("tips.deep_scan")}\n`));
        console.log(chalk.bold(`\n> ${t("footer.deploy_question")}\n`));

    } catch (error: any) {
        console.error(chalk.red(`\nCheck failed: ${error.message}`));
        process.exit(1);
    }
}
