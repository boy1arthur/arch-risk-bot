import inquirer from 'inquirer';
import chalk from 'chalk';
import { printBanner } from './banner.js';
import { runCheck } from '../commands/check.js';
import { runAudit } from '../commands/audit.js';
import { showPathPicker, isSafePath } from '../utils/pathPicker.js';
import path from 'path';
import fs from 'fs-extra';

export async function showMainMenu() {
    printBanner();

    console.log(chalk.gray("Welcome to ArchRisk. How can we help you deploy today?\n"));

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Select an option:',
            choices: [
                { name: `🟢 ${chalk.bold('Fast Scan')}   - Instant Release Readiness Check`, value: 'check' },
                { name: `🔍 ${chalk.bold('Deep Audit')}  - AI Architecture Analysis`, value: 'audit' },
                { name: `⚙️  ${chalk.bold('Setup')}       - Configure AI Provider`, value: 'config' },
                new inquirer.Separator(),
                { name: `🚪 ${chalk.gray('Exit')}`, value: 'exit' }
            ]
        }
    ]);

    if (action === 'exit') {
        console.log(chalk.gray('\nSee you next deploy. 👋'));
        process.exit(0);
    }

    if (action === 'config') {
        // We need to import the config action dynamically or move it to a separate file to avoid circular deps if index.ts imports menu.ts
        // For now, let's just run the config logic here or import it. 
        // Since config logic is inside index.ts action currently, it's better to refactor config to a command file.
        // But for now to avoid huge refactor, I will ask user to run archrisk config manually or just implement simple config here.
        // Actually, looking at index.ts, config action is simple. Let's move execution to index.ts handling or import a runConfig function.
        // I'll assume runConfig will be exported from a new file or I'll implement it here for now to save time, 
        // BUT best practice is to have commands/config.ts. 
        // Let's stick to returning the action and handling it in index.ts for simplicity in this step, 
        // OR better: handle it here if I can import the commands.

        // I will return the action and let index.ts handle the dispatching to keep menu.ts pure UI if possible, 
        // but the prompt implies "menu handles it".
        // Let's go with: menu returns the selection, index.ts calls the function.
        // actually returning the selection is cleaner for the entry point.
        return action;
    }

    // For check and audit, we need a path.
    let targetDir = await showPathPicker();
    const safety = isSafePath(targetDir);

    if (!safety.safe) {
        console.error(chalk.red(`\n🛡️ Safety Guard: ${safety.reason}`));
        process.exit(1);
    }

    if (action === 'check') {
        await runCheck(targetDir);
    } else if (action === 'audit') {
        await runAudit(targetDir);
    }

    return action;
}
