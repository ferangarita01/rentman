const { VertexAI } = require('@google-cloud/vertexai');

async function listModels() {
    const project = process.env.PROJECT_ID || 'agent-gen-1';
    const location = 'us-central1';

    console.log(`Checking models in project: ${project}, location: ${location}`);

    // We can't easily "list" foundation models via this SDK, but we can try to instantiate them 
    // and see if they don't throw immediate errors, or try a test generation.

    const vertex_ai = new VertexAI({ project: project, location: location });

    const candidates = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-001',
        'gemini-1.5-pro',
        'gemini-1.5-pro-001',
        'gemini-1.0-pro',
        'gemini-1.0-pro-001',
        'gemini-pro'
    ];

    for (const modelName of candidates) {
        process.stdout.write(`Testing ${modelName}... `);
        try {
            const model = vertex_ai.preview.getGenerativeModel({ model: modelName });
            const resp = await model.generateContent('Hi');
            console.log('✅ OK');
        } catch (e) {
            console.log('❌ FAIL');
            // console.log(e.message); // Uncomment for debug
        }
    }
}

listModels();
