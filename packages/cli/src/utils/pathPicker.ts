import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * Checks if a path is a root or system-critical directory.
 */
export function isSafePath(targetPath: string): { safe: boolean; reason?: string } {
    const absolutePath = path.resolve(targetPath);
    const root = path.parse(absolutePath).root;

    // Block scanning of the actual root
    if (absolutePath === root) {
        return {
            safe: false,
            reason: "Too broad path. Please select a specific project folder."
        };
    }

    // Block common system directories for both Linux and Windows
    const unsafeDirs = [
        '/bin', '/boot', '/dev', '/etc', '/lib', '/lib64', '/proc', '/root', '/run', '/sbin', '/sys', '/usr', '/var',
        'C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)', 'C:\\Users'
    ];

    if (unsafeDirs.some(dir => absolutePath.startsWith(path.normalize(dir)))) {
        return {
            safe: false,
            reason: "System directory detected. For safety, ArchRisk only scans project folders."
        };
    }

    return { safe: true };
}

/**
 * Interactive folder picker for choosing the analysis target.
 */
export async function showPathPicker(): Promise<string> {
    const currentDir = process.cwd();

    // Get subdirectories (excluding hidden ones and node_modules)
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    const subdirs = entries
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules')
        .map(entry => `./${entry.name}/`);

    const choices = [
        { name: chalk.cyan(`[ ./ ] Current Folder (${path.basename(currentDir)})`), value: '.' },
        ...subdirs.map(dir => ({ name: `[ ${dir} ]`, value: dir })),
        new inquirer.Separator(),
        { name: chalk.yellow('[ Enter manual path... ]'), value: 'MANUAL' }
    ];

    const { selectedPath } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedPath',
            message: '분석할 프로젝트 경로를 선택해주세요:',
            choices: choices,
            pageSize: 10
        }
    ]);

    if (selectedPath === 'MANUAL') {
        const { manualPath } = await inquirer.prompt([
            {
                type: 'input',
                name: 'manualPath',
                message: 'Enter the project path:',
                validate: (input) => input.trim().length > 0 || 'Path cannot be empty.'
            }
        ]);
        return manualPath;
    }

    return selectedPath;
}
