import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';
import { RentmanContext } from '@/lib/vertex-ai';

const vertexAI = new VertexAI({
  project: 'agent-gen-1',
  location: 'us-central1',
});

const model = vertexAI.preview.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    maxOutputTokens: 512,
    temperature: 0.5,
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context } = body as { context?: RentmanContext };

    const prompt = `Como asistente de alquileres, genera 3 sugerencias cortas y útiles para el usuario.
${context?.userName ? `Usuario: ${context.userName}` : ''}
${context?.currentRental ? `Alquiler actual: ${JSON.stringify(context.currentRental)}` : ''}

Responde SOLO con las 3 sugerencias en formato de lista, una por línea, sin números ni viñetas.`;

    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Dividir en líneas y limpiar
    const suggestions = text
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 3);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { suggestions: [] },
      { status: 500 }
    );
  }
}
