import * as fs from 'fs';
import * as path from 'path';

/**
 * [Phase 8] Architecture Scanner - Ported from Code Observatory
 */

export interface ArchIssue {
    id: string;
    severity: 'WARN' | 'ERROR';
    ruleId: string;
    title: string;
    details: string;
    relatedPaths?: string[];
    metrics?: any;
}

export interface ArchNode {
    id: string;
    kind: 'project' | 'folder' | 'file' | 'hotspot' | 'cycle';
    label: string;
    health: 'OK' | 'WARN' | 'ERROR';
    path: string;
    metrics: any;
    issues?: string[];
}

export interface ArchEdge {
    id: string;
    source: string;
    target: string;
    type: 'contains' | 'imports';
}

export interface ArchScanResult {
    scanId: string;
    rootPath: string;
    createdAt: number;
    health: 'OK' | 'WARN' | 'ERROR';
    nodes: ArchNode[];
    edges: ArchEdge[];
    issues: ArchIssue[];
    phase: 'FAST' | 'DEPS' | 'DONE';
}

function safeId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isTextFile(p: string) {
    const ext = path.extname(p).toLowerCase();
    return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.py'].includes(ext);
}

function isSkippableDir(name: string) {
    return ['node_modules', '.git', '.next', 'dist', 'build', 'out', '.turbo', '__pycache__', 'venv', '.venv'].includes(name);
}

function suspiciousFolderName(name: string) {
    const n = name.toLowerCase();
    return ['temp', 'tmp', 'backup', 'bak', 'old', 'new', 'new2', 'final', 'final_final', 'copy'].some(k => n.includes(k));
}

function countLOC(text: string) {
    return text.split(/\r?\n/).length;
}

export function fastScan(rootPath: string): ArchScanResult {
    const start = Date.now();
    let fileCount = 0;
    let dirCount = 0;
    let rootFiles = 0;
    let maxDepth = 0;
    let suspiciousDirs: string[] = [];
    const hotspots: { filePath: string; loc: number }[] = [];

    function walk(dir: string, depth: number) {
        maxDepth = Math.max(maxDepth, depth);
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch { return; }

        for (const ent of entries) {
            const full = path.join(dir, ent.name);
            if (ent.isDirectory()) {
                if (isSkippableDir(ent.name)) continue;
                dirCount++;
                if (suspiciousFolderName(ent.name)) suspiciousDirs.push(full);
                walk(full, depth + 1);
            } else if (ent.isFile()) {
                fileCount++;
                if (dir === rootPath) rootFiles++;
                if (isTextFile(full)) {
                    try {
                        const txt = fs.readFileSync(full, 'utf8');
                        const loc = countLOC(txt);
                        if (loc >= 800) hotspots.push({ filePath: full, loc });
                    } catch { }
                }
            }
        }
    }

    walk(rootPath, 0);

    const scanId = safeId('scan');
    const issues: ArchIssue[] = [];
    const nodes: ArchNode[] = [];
    const edges: ArchEdge[] = [];
    let overall: 'OK' | 'WARN' | 'ERROR' = 'OK';

    if (rootFiles > 60) {
        overall = 'WARN';
        issues.push({ id: safeId('issue'), severity: 'WARN', ruleId: 'root-files', title: 'Root is cluttered', details: `Root directory has ${rootFiles} files. Consider moving code under src/.`, metrics: { rootFiles } });
    }
    if (maxDepth > 10) {
        if (overall === 'OK') overall = 'WARN';
        issues.push({ id: safeId('issue'), severity: 'WARN', ruleId: 'deep-nesting', title: 'Deep directory nesting', details: `Max directory depth is ${maxDepth}.`, metrics: { maxDepth } });
    }
    if (suspiciousDirs.length >= 2) {
        if (overall === 'OK') overall = 'WARN';
        issues.push({ id: safeId('issue'), severity: 'WARN', ruleId: 'suspicious-folders', title: 'Suspicious folders found', details: `Found folders like temp/backup/etc.`, relatedPaths: suspiciousDirs.slice(0, 10).map(p => path.relative(rootPath, p)), metrics: { count: suspiciousDirs.length } });
    }
    if (hotspots.length >= 3) {
        if (overall === 'OK') overall = 'WARN';
        issues.push({ id: safeId('issue'), severity: 'WARN', ruleId: 'hotspots', title: 'Large files (hotspots)', details: `Found ${hotspots.length} files with LOC >= 800.`, relatedPaths: hotspots.slice(0, 10).map(h => path.relative(rootPath, h.filePath)), metrics: { hotspots: hotspots.length } });
    }

    nodes.push({ id: 'ARCH_PROJECT', kind: 'project', label: path.basename(rootPath) || 'PROJECT', health: overall, path: rootPath, metrics: { fileCount, dirCount, rootFiles, maxDepth, ms: Date.now() - start }, issues: issues.map(i => i.id) });

    return { scanId, rootPath, createdAt: Date.now(), health: overall, nodes, edges, issues, phase: 'FAST' };
}

// --- DEPS SCAN ---
function parseRelativeImports(fileText: string) {
    const imports: string[] = [];
    const re1 = /import\s+[^'"]*['"]([^'"]+)['"]/g;
    const re2 = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
    const re3 = /from\s+['"]([^'"]+)['"]\s+import/g; // Python style
    let m;
    while ((m = re1.exec(fileText))) imports.push(m[1]);
    while ((m = re2.exec(fileText))) imports.push(m[1]);
    while ((m = re3.exec(fileText))) imports.push(m[1]);
    return imports.filter(s => s.startsWith('./') || s.startsWith('../') || s.includes('.'));
}

function resolveImport(fromFile: string, spec: string) {
    const base = path.resolve(path.dirname(fromFile), spec);
    const candidates = [
        base,
        base + '.py', base + '.ts', base + '.tsx', base + '.js', base + '.jsx',
        path.join(base, '__init__.py'), path.join(base, 'index.ts'), path.join(base, 'index.js')
    ];
    for (const c of candidates) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
    }
    return null;
}

export function depsScan(rootPath: string): { adj: Map<string, Set<string>>, cycles: string[][] } {
    const files: string[] = [];
    function walk(dir: string) {
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
        for (const ent of entries) {
            const full = path.join(dir, ent.name);
            if (ent.isDirectory()) { if (isSkippableDir(ent.name)) continue; walk(full); }
            else if (ent.isFile() && isTextFile(full)) files.push(full);
        }
    }
    walk(rootPath);

    const adj = new Map<string, Set<string>>();
    for (const f of files) {
        let txt;
        try { txt = fs.readFileSync(f, 'utf8'); } catch { continue; }
        const specs = parseRelativeImports(txt);
        for (const spec of specs) {
            const resolved = resolveImport(f, spec);
            if (!resolved) continue;
            if (!adj.has(f)) adj.set(f, new Set());
            adj.get(f)!.add(resolved);
        }
    }

    const visited = new Set<string>();
    const stack = new Set<string>();
    const parent = new Map<string, string>();
    const cycles: string[][] = [];

    function dfs(u: string) {
        visited.add(u);
        stack.add(u);
        const nbrs = adj.get(u);
        if (nbrs) {
            for (const v of nbrs) {
                if (!visited.has(v)) {
                    parent.set(v, u);
                    dfs(v);
                } else if (stack.has(v)) {
                    const cycle = [v];
                    let cur: string | undefined = u;
                    while (cur && cur !== v && cycle.length < 50) {
                        cycle.push(cur);
                        cur = parent.get(cur);
                    }
                    cycle.push(v);
                    cycle.reverse();
                    cycles.push(cycle);
                }
            }
        }
        stack.delete(u);
    }

    for (const f of adj.keys()) {
        if (!visited.has(f)) dfs(f);
    }

    return { adj, cycles };
}

/**
 * Note: Full DEPS scan requires complex dependency resolution logic.
 * For now, we provide the FAST scan as the baseline for the GitHub App.
 */
