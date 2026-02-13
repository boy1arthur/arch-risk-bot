import chalk from 'chalk';

export function formatScore(score: number): string {
    if (score < 70) return chalk.red.bold(score.toString());
    if (score < 90) return chalk.yellow.bold(score.toString());
    return chalk.green.bold(score.toString());
}

export function formatStatus(status: string): string {
    if (status === 'Not Ready for Deployment') return chalk.red.bold(`🔴 ${status}`);
    if (status === 'Needs Attention') return chalk.yellow.bold(`🟡 ${status}`);
    return chalk.green.bold(`🟢 ${status}`);
}
