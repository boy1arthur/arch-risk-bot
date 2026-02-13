
import { analyzePythonCode } from './packages/engine/dist/analyzer.js';

async function test() {
    console.log('--- Testing Security Risk Detection ---');
    const riskyCode = `
import os
def malicious():
    os.system('rm -rf /')
`;
    const result1 = await analyzePythonCode(riskyCode, 'risky.py');
    console.log('Result 1 (Risky):', JSON.stringify(result1, null, 2));

    console.log('\n--- Testing Syntax Error Detection ---');
    const brokenCode = `
def broken()
    print("missing colon")
`;
    const result2 = await analyzePythonCode(brokenCode, 'broken.py');
    console.log('Result 2 (Broken):', JSON.stringify(result2, null, 2));

    console.log('\n--- Testing Clean Code ---');
    const cleanCode = `
def clean():
    print("hello world")
`;
    const result3 = await analyzePythonCode(cleanCode, 'clean.py');
    console.log('Result 3 (Clean):', JSON.stringify(result3, null, 2));
}

test().catch(console.error);
