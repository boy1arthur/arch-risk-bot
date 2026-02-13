import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface DeepAnalysisResult {
    summary: string;
    refactoringGuides: {
        file: string;
        description: string;
        suggestion: string;
    }[];
    techDebtScore: number;
}

export async function runDeepAnalysis(
    repoDir: string,
    provider: string,
    apiKey: string
): Promise<DeepAnalysisResult> {
    if (provider !== 'GEMINI') {
        throw new Error(`Provider ${provider} is not yet supported in Deep Analysis.`);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Gather some context (simplified for MVP)
    const files = await getRelevantFiles(repoDir);
    const codeContext = await Promise.all(files.map(async f => {
        const content = await fs.readFile(f, 'utf8');
        return `File: ${path.relative(repoDir, f)}\nContent:\n${content.substring(0, 1000)}...`;
    }));

    const prompt = `
    You are an expert Software Architect. Analyze the following project for:
    1. Code smells and anti-patterns.
    2. Specific refactoring suggestions.
    3. Technical debt estimation.

    Project Context:
    ${codeContext.join('\n\n')}

    Return JSON format:
    {
      "summary": "High level overview",
      "refactoringGuides": [
        {"file": "filename", "description": "why it needs refactoring", "suggestion": "how to refactor"}
      ],
      "techDebtScore": 0-100
    }
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
        const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || '{}';
        return JSON.parse(jsonStr);
    } catch (e) {
        return {
            summary: "AI analysis completed but failed to parse structured data.",
            refactoringGuides: [],
            techDebtScore: 50
        };
    }
}

async function getRelevantFiles(dir: string): Promise<string[]> {
    const allFiles: string[] = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
        if (item === 'node_modules' || item.startsWith('.')) continue;
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
            allFiles.push(...await getRelevantFiles(fullPath));
        } else if (item.endsWith('.py') || item.endsWith('.ts') || item.endsWith('.js')) {
            allFiles.push(fullPath);
        }
    }

    return allFiles.slice(0, 5); // MVP: Limit to 5 files for context
}
