import { analyzePythonCode } from './packages/engine/dist/index.js';
import * as fs from 'fs';

async function testArch() {
    console.log('--- Testing Architecture Guardrail ---');

    const godModulePath = './god_module_test.py';
    const godModuleCode = fs.readFileSync(godModulePath, 'utf8');

    console.log(`Analyzing ${godModulePath} (${godModuleCode.split('\n').length} lines)...`);
    const result = await analyzePythonCode(godModuleCode, 'god_module_test.py');

    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.hasError && result.type === 'ArchitectureRisk') {
        console.log('✅ God Module detection SUCCESS');
    } else {
        console.log('❌ God Module detection FAILED');
    }
}

testArch().catch(console.error);
