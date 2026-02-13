/**
 * Cryptographic Utilities
 * NACL signature verification for autonomous agents
 */

import nacl from 'tweetnacl';
import { Buffer } from 'buffer';
import crypto from 'crypto';

/**
 * Verify NACL signature
 * Used for autonomous agents that sign their requests
 */
export function verifyNaclSignature(params: {
  message: string;
  signature: string;
  publicKey: string;
}): boolean {
  try {
    const messageBytes = Buffer.from(params.message, 'utf8');
    const signatureBytes = Buffer.from(params.signature, 'base64');
    const publicKeyBytes = Buffer.from(params.publicKey, 'base64');

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
  } catch (error) {
    return false;
  }
}

/**
 * Generate API key
 * Format: sk_live_<random_32_chars> or sk_test_<random_32_chars>
 */
export function generateApiKey(prefix: 'live' | 'test' = 'live'): string {
  const randomBytes = crypto.randomBytes(24);
  const randomString = randomBytes.toString('base64url');

  return `sk_${prefix}_${randomString}`;
}


import config from '../config.js';

/**
 * Hash API key for storage
 * Uses HMAC-SHA256 with a secret pepper to prevent rainbow table attacks
 */
export async function hashApiKey(key: string): Promise<string> {
  const hmac = crypto.createHmac('sha256', config.API_KEY_SECRET);
  hmac.update(key);
  return hmac.digest('hex');
}

/**
 * Generate secure random string
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

/**
 * Encrypt sensitive data
 */
export async function encrypt(text: string, secret: string): Promise<string> {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(secret.slice(0, 32)),
    iv
  );

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export async function decrypt(encryptedText: string, secret: string): Promise<string> {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

  const algorithm = 'aes-256-gcm';
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secret.slice(0, 32)),
    iv
  );

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
