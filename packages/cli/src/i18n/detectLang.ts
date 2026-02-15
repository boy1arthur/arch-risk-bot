export function detectSystemLang(): string {
    const envLang =
        process.env.ARCHRISK_LANG ||
        process.env.LC_ALL ||
        process.env.LC_MESSAGES ||
        process.env.LANG;

    if (envLang && envLang.toLowerCase().includes("ko")) {
        return "ko";
    }

    try {
        const locale = Intl.DateTimeFormat().resolvedOptions().locale;
        if (locale.toLowerCase().includes("ko")) {
            return "ko";
        }
    } catch { }

    return "en";
}
