const { getVertexModels } = require('../config/vertex');

async function analyzeWithAI(record, updateTaskStatusCallback) {
    const { generativeModel } = getVertexModels();
    console.log(`🤖 AI Analyzing Task: ${record.title}`);

    const prompt = `You are the "Rentman Brain", an AI safety and viability analyzer for task marketplace.
Analyze this task and respond ONLY with valid JSON (no markdown, no code blocks):

Task Title: ${record.title}
Description: ${record.description}
Budget: $${record.budget_amount}
Type: ${record.task_type}

Required JSON format:
{
  "viable": true,
  "safety_score": 85,
  "complexity": "medium",
  "reasoning": "Clear task with reasonable budget",
  "tags": ["delivery", "urban"]
}

Rules:
- viable: true if task is legal, safe, and achievable
- safety_score: 0-100 (reject if <70)
- complexity: "low" | "medium" | "high"
- reasoning: max 100 characters
- tags: 2-4 relevant keywords

Respond with JSON only:`;

    const AI_TIMEOUT_MS = 30000;
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI analysis timeout after 30s')), AI_TIMEOUT_MS);
    });

    try {
        const result = await Promise.race([
            generativeModel.generateContent(prompt),
            timeoutPromise
        ]);

        const text = result.response.candidates[0].content.parts[0].text;
        let aiAnalysis;
        try {
            aiAnalysis = JSON.parse(text);
        } catch (e) {
            const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiAnalysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } else {
                throw new Error('Failed to extract JSON from AI response');
            }
        }

        console.log('🧠 AI Analysis Result:', JSON.stringify(aiAnalysis, null, 2));

        if (typeof aiAnalysis.viable !== 'boolean' || typeof aiAnalysis.safety_score !== 'number') {
            throw new Error('Invalid AI response structure');
        }

        if (aiAnalysis.viable && aiAnalysis.safety_score > 70) {
            await updateTaskStatusCallback(record.id, 'matching', { ai_analysis: aiAnalysis });
            console.log('✅ Task Approved for Matching');
        } else {
            await updateTaskStatusCallback(record.id, 'flagged', { ai_analysis: aiAnalysis });
            console.log('⚠️ Task Flagged for Review');
        }

    } catch (err) {
        console.error('💥 AI ANALYSIS FAILED', err);
        // Manual review fallback
        await updateTaskStatusCallback(record.id, 'manual_review', {
            ai_error: err.message,
            requires_human_review: true
        });
    }
}

async function validateProofWithAI(fileUrl, taskContext) {
    const { generativeModel } = getVertexModels();
    try {
        const prompt = `Analiza esta prueba de trabajo y valídala contra los requisitos de la tarea.

Tarea: ${taskContext.title}
Descripción: ${taskContext.description}
Tipo: ${taskContext.task_type}

Responde SOLO con JSON válido:
{
    "valid": true,
    "confidence": 85,
    "issues": [],
    "summary": "Proof matches task requirements"
}

Reglas:
- valid: true si la prueba demuestra trabajo completado
- confidence: 0-100
- issues: array de problemas detectados
- summary: resumen breve`;

        const result = await generativeModel.generateContent(prompt);
        const text = result.response.candidates[0].content.parts[0].text;

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { valid: true, confidence: 50, issues: [], summary: 'Manual review required' };
    } catch (error) {
        console.error('❌ AI validation error:', error);
        return { valid: true, confidence: 0, issues: ['AI validation failed'], summary: 'Manual review required' };
    }
}

async function generateDisputeSummary(taskId, task, disputeReason, proofs) {
    const { generativeModel } = getVertexModels();
    try {
        const prompt = `Genera un resumen objetivo de esta disputa para el equipo de soporte.

Tarea: ${task.title}
Budget: $${task.budget_amount}
Razón de disputa: ${disputeReason}

Pruebas enviadas: ${proofs?.length || 0}
${proofs?.map(p => `- ${p.proof_type}: ${p.status}`).join('\n')}

Genera un resumen ejecutivo en JSON:
{
    "severity": "high|medium|low",
    "recommended_action": "release|refund|mediation",
    "key_points": ["punto1", "punto2"],
    "evidence_quality": "strong|moderate|weak"
}`;

        const result = await generativeModel.generateContent(prompt);
        const text = result.response.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { severity: 'medium', recommended_action: 'mediation' };
    } catch (error) {
        console.error('❌ Dispute summary error:', error);
        return { severity: 'medium', recommended_action: 'mediation', error: error.message };
    }
}


module.exports = { analyzeWithAI, validateProofWithAI, generateDisputeSummary };
