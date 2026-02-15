import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { detectSystemLang } from "./detectLang.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Dict = Record<string, any>;

let dictionary: Dict = {};
export let currentLang = 'en';

function loadLocale(lang: string) {
    // Use absolute path relative to dist/src/i18n when compiled, or modify for dev
    // Since we are in packages/cli/src/i18n, and locales is in packages/cli/locales
    // When compiled: dist/i18n/index.js -> ../../locales (if copied) or we need to be careful.
    // The user code assumes relative path "../../locales".
    // Let's assume standard structure:
    // src/i18n/index.ts -> ../../locales  (in src)
    // dist/i18n/index.js -> ../../locales (in dist? or root?)

    // Strategy: Try to find locales relative to the running script

    // Option 1: In development (ts-node or similar), __dirname is src/i18n
    // Option 2: In production (node dist/index.js), __dirname is dist/i18n

    // We need to ensure 'locales' folder is copied to 'dist' or accessed correctly.
    // For now, let's try the user's path, but robustly check existence.

    const candidates = [
        path.join(__dirname, "../../locales", `${lang}.json`), // original user code path
        path.join(__dirname, "../../../locales", `${lang}.json`), // sometimes needed if structure differs
        path.join(process.cwd(), "packages/cli/locales", `${lang}.json`), // simplistic dev fallback
        path.join(process.cwd(), "locales", `${lang}.json`) // simplistic prod fallback
    ];

    let file = candidates.find(p => fs.existsSync(p));

    // Fallback to en if specific lang file not found
    if (!file && lang !== 'en') {
        const enCandidates = candidates.map(p => p.replace(`${lang}.json`, 'en.json'));
        file = enCandidates.find(p => fs.existsSync(p));
    }

    if (file) {
        try {
            return JSON.parse(fs.readFileSync(file, "utf-8"));
        } catch (e) {
            console.error("Failed to load locale file:", file, e);
        }
    }
    return {};
}

export function initI18n(cliLang?: string) {
    const lang = cliLang || detectSystemLang();
    currentLang = lang;
    dictionary = loadLocale(lang);
}

export function t(key: string, vars?: Record<string, string | number>) {
    const keys = key.split(".");
    let value: any = dictionary;

    for (const k of keys) value = value?.[k];

    if (!value) return key;

    if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
            value = value.replace(`{${k}}`, String(v));
        });
    }

    return value;
}
