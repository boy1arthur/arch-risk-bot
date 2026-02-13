/**
 * [The Brain] AI Diagnosis Engine (TypeScript Version)
 * 
 * Transforms errors and architecture issues into actionable solutions using Gemini API.
 */

import { ArchIssue } from "./archScanner.js";

export interface DiagnosisResult {
    severity: 'error' | 'warning';
    issue: string;
    suggestion: string;
    fixedCode: string;
    confidence: number;
}

const diagnosisCache = new Map<string, DiagnosisResult>();

/**
 * Call Gemini API with structured prompt
 */
async function callGeminiAPI(prompt: string): Promise<DiagnosisResult> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.warn('[Brain] Gemini API key not configured. Returning mock diagnosis.');
        return mockDiagnosis();
    }

    const model = process.env.AI_DIAGNOSIS_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: parseInt(process.env.AI_DIAGNOSIS_MAX_TOKENS || '1024')
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const text = data.candidates[0].content.parts[0].text;

        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1] || jsonMatch[0]);
        }

        throw new Error('Failed to parse JSON from Gemini response');
    } catch (error: any) {
        console.error('[Brain] Gemini API error:', error.message);
        return mockDiagnosis('AI Diagnosis limited - using fallback', error.message);
    }
}

function mockDiagnosis(
    issue = 'API key not configured - using mock diagnosis',
    suggestion = 'Set GEMINI_API_KEY in environment variables'
): DiagnosisResult {
    return {
        severity: 'error',
        issue: issue,
        suggestion: suggestion,
        fixedCode: '# Gemini API quota exceeded or key missing. Using static fallback analysis.',
        confidence: 0.0
    };
}

/**
 * Diagnose code error using Gemini AI
 */
export async function diagnoseCodeError(
    file: string,
    line: number,
    errorType: string,
    errorMessage: string,
    codeContext: string
): Promise<DiagnosisResult> {
    const cacheKey = `${file}:${line}:${errorType}`;
    if (diagnosisCache.has(cacheKey)) {
        return diagnosisCache.get(cacheKey)!;
    }

    const prompt = `당신은 AI-to-Job 컴파일러입니다. Python 에러를 실행 가능한 작업 정의로 변환하는 역할입니다.

**에러 정보:**
- 타입: ${errorType}
- 라인: ${line}
- 파일: ${file}
- 에러 메시지: ${errorMessage}

**코드 컨텍스트:**
\`\`\`python
${codeContext}
\`\`\`

**작업:**
이 에러를 분석하고 다음의 정확한 구조로 JSON 응답만 제공하세요:
{
    "severity": "error" | "warning",
    "issue": "문제에 대한 간단한 설명 (한글)",
    "suggestion": "실행 가능한 수정 지침 (한글)",
    "fixedCode": "수정된 코드 스니펫",
    "confidence": 0.0 ~ 1.0 사이의 값
}

**중요**: 유효한 JSON만 응답하세요. 설명이나 JSON 블록 밖의 마크다운은 작성하지 마세요.`;

    const diagnosis = await callGeminiAPI(prompt);
    diagnosisCache.set(cacheKey, diagnosis);
    return diagnosis;
}

/**
 * Diagnose architecture issue using Gemini AI
 */
export async function diagnoseArchIssue(
    issue: ArchIssue,
    fileContexts: { path: string, content: string }[]
): Promise<DiagnosisResult> {
    const contexts = fileContexts.map(f => `--- File: ${f.path} ---\n${f.content.slice(0, 2000)}...`).join('\n\n');

    const prompt = `당신은 Senior Software Architect AI입니다. 현재 프로젝트의 아키텍처 결함을 분석하고 리팩토링 방안을 제시하는 역할입니다.

**탐지된 이슈 정보:**
- 타입(RuleId): ${issue.ruleId}
- 제목: ${issue.title}
- 상세 설명: ${issue.details}
- 관련 경로: ${issue.relatedPaths?.join(', ') || 'N/A'}

**코드 컨텍스트 (일부):**
${contexts}

**작업:**
이 아키텍처 이슈를 분석하고 다음의 정확한 구조로 JSON 응답만 제공하세요:
{
    "severity": "error" | "warning",
    "issue": "아키텍처 문제에 대한 구조적 분석 (한글)",
    "suggestion": "구체적인 리팩토링 가이드 및 단계별 조치 사항 (한글)",
    "fixedCode": "리팩토링에 도움이 되는 코드 스니펫 또는 인터페이스 설계 예시",
    "confidence": 0.0 ~ 1.0 사이의 값
}

**중요**: 유효한 JSON만 응답하세요. 설명이나 JSON 블록 밖의 마크다운은 작성하지 마세요.`;

    return await callGeminiAPI(prompt);
}
