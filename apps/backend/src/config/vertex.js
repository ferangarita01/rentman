const { VertexAI } = require('@google-cloud/vertexai');
const { getSecret } = require('./secrets');

let vertexInstance = null;
let generativeModel = null;
let chatModel = null;
let suggestionsModel = null;

async function initializeVertex() {
    if (vertexInstance) return { vertexInstance, generativeModel, chatModel, suggestionsModel };

    const PROJECT_ID = process.env.PROJECT_ID || 'agent-gen-1'; // Or fetch from secrets if needed

    vertexInstance = new VertexAI({ project: PROJECT_ID, location: 'us-central1' });

    // Main analysis model
    generativeModel = vertexInstance.preview.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            'maxOutputTokens': 2048,
            'temperature': 0.4,
            'topP': 1
        },
    });

    // Chat model
    chatModel = vertexInstance.preview.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
        },
    });

    // Suggestions model
    suggestionsModel = vertexInstance.preview.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.5,
        },
    });

    console.log('✅ Vertex AI initialized');
    return { vertexInstance, generativeModel, chatModel, suggestionsModel };
}

function getVertexModels() {
    if (!vertexInstance) {
        throw new Error('Vertex AI not initialized. Call initializeVertex() first.');
    }
    return { generativeModel, chatModel, suggestionsModel };
}

module.exports = { initializeVertex, getVertexModels };
