/**
 * Stripe Service for Escrow Management
 */

import Stripe from 'stripe';
import config from '../config.js';
import logger from '../utils/logger.js';

const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export class EscrowService {
  /**
   * Create escrow payment intent
   * Holds funds until task completion
   */
  static async createEscrow(params: {
    agentId: string;
    taskId: string;
    amount: number;
    currency: string;
    description: string;
  }): Promise<{
    paymentIntentId: string;
    clientSecret: string;
  }> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: params.currency.toLowerCase(),
        description: params.description,
        metadata: {
          agent_id: params.agentId,
          task_id: params.taskId,
          type: 'escrow',
        },
        capture_method: 'manual', // Don't capture immediately
      });

      logger.info(`Escrow created: ${paymentIntent.id} for task ${params.taskId}`);

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error) {
      logger.error(error, 'Error creating escrow');
      throw new Error('Failed to create escrow payment');
    }
  }

  /**
   * Release escrow to human operator
   */
  static async releaseEscrow(params: {
    paymentIntentId: string;
    humanId: string;
    taskId: string;
  }): Promise<boolean> {
    try {
      // Capture the payment
      const paymentIntent = await stripe.paymentIntents.capture(
        params.paymentIntentId
      );

      logger.info(`Escrow released: ${paymentIntent.id} for task ${params.taskId}`);

      // In production, you'd also:
      // 1. Create a transfer to human's Stripe Connect account
      // 2. Update escrow_transactions table
      // 3. Notify human of payment

      return true;
    } catch (error) {
      logger.error(error, 'Error releasing escrow');
      throw new Error('Failed to release escrow payment');
    }
  }

  /**
   * Refund escrow to agent (if task fails)
   */
  static async refundEscrow(params: {
    paymentIntentId: string;
    reason?: string;
  }): Promise<boolean> {
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(
        params.paymentIntentId
      );

      logger.info(`Escrow refunded: ${paymentIntent.id}`);

      return true;
    } catch (error) {
      logger.error(error, 'Error refunding escrow');
      throw new Error('Failed to refund escrow');
    }
  }

  /**
   * Get escrow status
   */
  static async getEscrowStatus(paymentIntentId: string): Promise<{
    status: string;
    amount: number;
    currency: string;
    metadata: Stripe.Metadata;
  }> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      logger.error(error, 'Error getting escrow status');
      throw new Error('Failed to get escrow status');
    }
  }
}

export default stripe;
