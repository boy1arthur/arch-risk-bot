#!/usr/bin/env node
import { Command } from 'commander';
import { printBanner } from './ui/banner.js';
import { showMainMenu } from './ui/menu.js';
import { runCheck } from './commands/check.js';
import { runAudit } from './commands/audit.js';
import { showPathPicker, isSafePath } from './utils/pathPicker.js';
import path from 'path';
import fs from 'fs-extra';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

import { initI18n } from './i18n/index.js';

dotenv.config();

const langFlagIndex = process.argv.indexOf("--lang");
const cliLang = langFlagIndex !== -1 ? process.argv[langFlagIndex + 1] : undefined;

initI18n(cliLang);

const program = new Command();

program
    .name('archrisk')
    .description('Code Release Readiness Platform – The Pre-Deploy Ritual.')
    .version('0.1.9')
    .option('--lang <lang>', 'Set language (en/ko)')
    .action(async () => {
        // If no command is provided, show the welcome ritual
        const action = await showMainMenu();
        if (action === 'config') {
            await runConfig();
        }
    });

async function runConfig() {
    const { default: inquirer } = await import('inquirer');

    console.log(chalk.blue.bold('\n⚙️ ArchRisk Bot Configuration\n'));

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'provider',
            message: 'Select your AI Deep-Scan provider:',
            choices: ['Gemini', 'OpenAI', 'Anthropic (Coming Soon)'],
        },
        {
            type: 'password',
            name: 'apiKey',
            message: 'Paste your API Key:',
            mask: '*',
        }
    ]);

    if (answers.provider.includes('Coming Soon')) {
        console.log(chalk.yellow('\n⚠️  This provider is not yet supported. Please choose another.'));
        return;
    }

    const envContent = `ARCHRISK_AI_PROVIDER=${answers.provider.toUpperCase()}\nARCHRISK_API_KEY=${answers.apiKey}\n`;
    const envPath = path.resolve(process.cwd(), '.env');

    await fs.appendFile(envPath, envContent);
    console.log(chalk.green(`\n✅ Configuration saved to ${envPath}`));
    console.log(chalk.gray('Now you can run ') + chalk.bold('archrisk audit') + chalk.gray(' to use your own API credits.'));
}

program
    .command('check')
    .alias('scan')
    .description('Run a local Release Readiness Check before deployment')
    .argument('[dir]', 'Directory to check')
    .action(async (dir) => {
        printBanner();

        let targetDir = dir;
        if (!targetDir) {
            targetDir = await showPathPicker();
        }

        const safety = isSafePath(targetDir);
        if (!safety.safe) {
            console.error(chalk.red(`\n🛡️ Safety Guard: ${safety.reason}`));
            process.exit(1);
        }

        await runCheck(targetDir);
    });

program
    .command('audit')
    .alias('deep-scan')
    .description('Architecture Deep Audit (Requires your own API Key)')
    .argument('[dir]', 'Directory to audit')
    .action(async (dir) => {
        printBanner();

        let targetDir = dir;
        if (!targetDir) {
            targetDir = await showPathPicker();
        }

        const safety = isSafePath(targetDir);
        if (!safety.safe) {
            console.error(chalk.red(`\n🛡️ Safety Guard: ${safety.reason}`));
            process.exit(1);
        }

        await runAudit(targetDir);
    });

program
    .command('config')
    .description('Configure AI providers and API keys for deep-scan')
    .action(async () => {
        await runConfig();
    });

program.parse();
