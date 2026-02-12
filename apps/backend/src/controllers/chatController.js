const { getVertexModels } = require('../config/vertex');

function generateSystemPrompt(context) {
    const basePrompt = `Eres RENTMAN_OS, un asistente AI especializado en coordinar tareas físicas para operadores humanos.
Tu función es ayudar a los operadores a:
- Gestionar contratos activos y entregas
- Recibir y verificar pruebas de trabajo (fotos, audio, GPS)
- Confirmar ubicaciones y coordinar logística
- Responder preguntas sobre procedimientos
- Validar que las tareas se completen correctamente

Características de tu personalidad:
- Conciso y directo (estilo militar/operacional)
- Usa terminología técnica (e.g., "Visual Proof", "GPS Fix", "Contract #")
- Confirma recepción de proofs inmediatamente
- Proactivo en pedir evidencia cuando falta

Siempre responde en español con tono operacional y profesional.`;

    let enrichedPrompt = basePrompt;

    if (context?.userName) {
        enrichedPrompt += `\n\nOperador actual: ${context.userName}`;
    }

    if (context?.currentContract) {
        enrichedPrompt += `\n\nContrato Activo:
- ID: ${context.currentContract.id}
- Tipo: ${context.currentContract.type}
- Ubicación: ${context.currentContract.location || 'N/A'}
- Estado: ${context.currentContract.status || 'active'}`;
    }

    if (context?.recentProofs && context.recentProofs.length > 0) {
        enrichedPrompt += `\n\nPruebas Recientes Recibidas:`;
        context.recentProofs.forEach((proof, idx) => {
            enrichedPrompt += `\n${idx + 1}. ${proof.type.toUpperCase()} - ${new Date(proof.timestamp).toLocaleTimeString()}`;
            if (proof.contractId) {
                enrichedPrompt += ` (Contract #${proof.contractId})`;
            }
        });
    }

    return enrichedPrompt;
}

const chat = async (req, res) => {
    try {
        const { chatModel } = getVertexModels();
        const { message, context, history } = req.body || {};

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const systemPrompt = generateSystemPrompt(context);
        const conversationParts = [{ text: systemPrompt }];

        if (history && history.length > 0) {
            history.forEach((msg) => {
                conversationParts.push({
                    text: `${msg.role === 'user' ? 'Usuario' : 'Rentman'}: ${msg.content}`,
                });
            });
        }

        conversationParts.push({ text: `Usuario: ${message}` });

        const result = await chatModel.generateContent({
            contents: [{ role: 'user', parts: conversationParts }],
        });

        const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

        res.json({
            response: responseText,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('❌ Error in chat API:', error);
        res.status(500).json({ error: 'Failed to generate response', details: error.message });
    }
};

const suggestions = async (req, res) => {
    try {
        const { suggestionsModel } = getVertexModels();
        const { context } = req.body;

        const prompt = `Como asistente de alquileres, genera 3 sugerencias cortas y útiles para el usuario.
${context?.userName ? `Usuario: ${context.userName}` : ''}
${context?.currentRental ? `Alquiler actual: ${JSON.stringify(context.currentRental)}` : ''}

Responde SOLO con las 3 sugerencias en formato de lista, una por línea, sin números ni viñetas.`;

        const result = await suggestionsModel.generateContent(prompt);
        const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const suggestions = text
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .slice(0, 3);

        res.json({ suggestions });
    } catch (error) {
        console.error('❌ Error generating suggestions:', error);
        res.status(500).json({ suggestions: [] });
    }
};

module.exports = { chat, suggestions };
