import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';
import { generateSystemPrompt, ChatMessage, RentmanContext } from '@/lib/vertex-ai';

// Inicializar Vertex AI
const vertexAI = new VertexAI({
  project: 'agent-gen-1',
  location: 'us-central1',
});

const model = vertexAI.preview.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.7,
    topP: 0.8,
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, history } = body as {
      message: string;
      context?: RentmanContext;
      history?: ChatMessage[];
    };

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Construir el historial de conversación
    const systemPrompt = generateSystemPrompt(context);
    const conversationParts = [
      { text: systemPrompt },
    ];

    // Agregar historial si existe
    if (history && history.length > 0) {
      history.forEach((msg) => {
        conversationParts.push({
          text: `${msg.role === 'user' ? 'Usuario' : 'Rentman'}: ${msg.content}`,
        });
      });
    }

    // Agregar mensaje actual
    conversationParts.push({ text: `Usuario: ${message}` });

    // Generar respuesta
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: conversationParts }],
    });

    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({
      response: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response', details: (error as Error).message },
      { status: 500 }
    );
  }
}
