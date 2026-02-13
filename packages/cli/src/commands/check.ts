import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { analyzeRepository } from 'archrisk-engine';
import { formatScore, formatStatus } from '../utils/format.js';

export async function runCheck(dir: string) {
    const targetDir = path.resolve(process.cwd(), dir);

    console.log(chalk.cyan("🔍 Running Pre-Deploy Ritual..."));
    console.log(chalk.gray(`Scanning project at: ${targetDir}\n`));

    if (!fs.existsSync(targetDir)) {
        console.error(chalk.red(`Error: Directory ${targetDir} does not exist.`));
        process.exit(1);
    }

    try {
        console.log(chalk.yellow('⚡ Initializing Production Readiness Engine (Zero API Cost)...'));
        const result = await analyzeRepository(targetDir);

        console.log(chalk.green('\n✅ Release Readiness Check Complete!'));
        console.log(chalk.white('-----------------------------------------'));
        console.log(`${chalk.bold('Production Readiness Score:')} ${formatScore(result.score)} / 95`);
        console.log(`${chalk.bold('Release Status:')} ${formatStatus(result.status)}`);
        console.log(chalk.white('-----------------------------------------'));

        if (result.findings && result.findings.length > 0) {
            console.log(chalk.bold(`\n🚩 Deployment Risks (${result.findings.length}):`));
            result.findings.forEach((f: any, i: number) => {
                const idTag = f.id ? chalk.yellow(`[${f.id}] `) : '';
                console.log(`\n${chalk.gray(`[${i + 1}]`)} ${idTag}${chalk.bold.red(f.title)}`);
                console.log(`${chalk.gray('File:')} ${f.file}${f.line > 0 ? ` (Line ${f.line})` : ''}`);
                console.log(`${chalk.red('• Evidence:')} ${f.evidence}`);
                console.log(`${chalk.blue('• Standard:')} ${f.standard}`);
                console.log(`${chalk.yellow('• Impact:')} ${f.impact}`);

                console.log(`${chalk.green('• Action:')}`);
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
            console.log(chalk.green('\n✨ No significant deployment risks found. Your project is Ready for Production!'));
        }

        console.log(chalk.white('\n-----------------------------------------'));
        console.log(chalk.green.bold("\n✔ Ritual Complete"));
        console.log(chalk.gray("Run this again before your next deploy."));
        console.log(chalk.blue('\nPro Tip: Run ') + chalk.bold('archrisk audit') + chalk.blue(' for the Architecture Deep Audit.\n'));

    } catch (error: any) {
        console.error(chalk.red(`\nCheck failed: ${error.message}`));
        process.exit(1);
    }
}
