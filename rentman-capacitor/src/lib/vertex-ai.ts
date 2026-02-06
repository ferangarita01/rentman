/**
 * Vertex AI Integration for Rentman Assistant
 * 
 * Este módulo maneja la comunicación con Vertex AI Gemini
 * para proporcionar un asistente inteligente de alquileres
 */

// Para Next.js, usaremos API Routes en lugar de cliente directo
// El cliente de Vertex AI solo funciona en Node.js backend

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface RentmanContext {
  userId?: string;
  userName?: string;
  currentRental?: any;
  recentActivity?: any[];
}

/**
 * Envía un mensaje al asistente Rentman vía API Route
 */
export async function chatWithRentman(
  message: string,
  context?: RentmanContext,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
        history: conversationHistory.slice(-10), // Últimos 10 mensajes
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error chatting with Rentman:', error);
    throw error;
  }
}

/**
 * Genera sugerencias basadas en el contexto actual
 */
export async function getSuggestions(context: RentmanContext): Promise<string[]> {
  try {
    const response = await fetch('/api/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.suggestions;
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
}

/**
 * Genera el system prompt para el asistente Rentman
 */
export function generateSystemPrompt(context?: RentmanContext): string {
  const basePrompt = `Eres Rentman, un asistente inteligente especializado en gestión de alquileres.

Tu función es ayudar a los usuarios a:
- Gestionar sus alquileres de forma eficiente
- Encontrar información sobre propiedades disponibles
- Responder preguntas sobre contratos y pagos
- Dar recomendaciones sobre mantenimiento
- Ayudar con la comunicación entre arrendadores y arrendatarios

Características de tu personalidad:
- Amigable pero profesional
- Conciso pero completo
- Proactivo en sugerencias
- Empático con las necesidades del usuario

Siempre responde en español y mantén un tono conversacional.`;

  if (context?.userName) {
    return `${basePrompt}\n\nEl usuario actual es: ${context.userName}`;
  }

  return basePrompt;
}
