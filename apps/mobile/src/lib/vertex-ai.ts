/**
 * Vertex AI Integration for Rentman Assistant
 * 
 * Este módulo maneja la comunicación con Vertex AI Gemini
 * para proporcionar un asistente inteligente de alquileres
 */

import { apiPost } from './api-client';

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
  // Comlink Context
  currentContract?: {
    id: string;
    type: string;
    location?: string;
    status?: string;
  };
  recentProofs?: Array<{
    type: 'image' | 'audio' | 'location';
    content: string;
    timestamp: Date;
    contractId?: string;
  }>;
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
    const response = await apiPost('/api/chat', {
      message,
      context,
      history: conversationHistory.slice(-10),
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
    const response = await apiPost('/api/suggestions', { context });

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

  // Inject current contract context
  if (context?.currentContract) {
    enrichedPrompt += `\n\nContrato Activo:
- ID: ${context.currentContract.id}
- Tipo: ${context.currentContract.type}
- Ubicación: ${context.currentContract.location || 'N/A'}
- Estado: ${context.currentContract.status || 'active'}`;
  }

  // Inject recent proofs context
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

/**
 * Helper to add proof to context
 */
export function addProofToContext(
  context: RentmanContext,
  proof: {
    type: 'image' | 'audio' | 'location';
    content: string;
    contractId?: string;
  }
): RentmanContext {
  const newProof = {
    ...proof,
    timestamp: new Date(),
  };

  const recentProofs = [...(context.recentProofs || []), newProof].slice(-5); // Keep last 5

  return {
    ...context,
    recentProofs,
  };
}
