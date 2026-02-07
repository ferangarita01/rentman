/**
 * Solana Authentication & Wallet Utilities
 * Handles wallet connection, message signing, and verification
 */

import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

export interface WalletProvider {
  publicKey: PublicKey | null;
  isConnected: boolean;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
}

/**
 * Get Phantom wallet provider
 */
export function getPhantomProvider(): WalletProvider | null {
  if (typeof window === 'undefined') return null;
  
  const provider = (window as any).solana;
  if (provider?.isPhantom) {
    return provider;
  }
  
  return null;
}

/**
 * Get Solflare wallet provider
 */
export function getSolflareProvider(): WalletProvider | null {
  if (typeof window === 'undefined') return null;
  
  const provider = (window as any).solflare;
  if (provider?.isSolflare) {
    return provider;
  }
  
  return null;
}

/**
 * Generate authentication message for signing
 */
export function generateAuthMessage(address: string, nonce: string): string {
  const timestamp = new Date().toISOString();
  return `RENTMAN AUTH\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nI authorize this wallet to access Rentman services.`;
}

/**
 * Sign message with wallet
 */
export async function signMessage(
  provider: WalletProvider,
  message: string
): Promise<{ signature: string; publicKey: string }> {
  if (!provider.publicKey) {
    throw new Error('Wallet not connected');
  }

  const encodedMessage = new TextEncoder().encode(message);
  const signedMessage = await provider.signMessage(encodedMessage);
  
  return {
    signature: bs58.encode(signedMessage),
    publicKey: provider.publicKey.toString(),
  };
}

/**
 * Verify signed message (server-side validation)
 */
export async function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    // This should be done server-side for security
    // Sending to API route for verification
    const response = await fetch('/api/verify-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature, publicKey }),
    });

    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Connect wallet with authentication flow
 */
export async function connectAndAuthenticate(
  provider: WalletProvider,
  nonce?: string
): Promise<{ address: string; signature: string; message: string }> {
  // Connect wallet
  const { publicKey } = await provider.connect();
  const address = publicKey.toString();

  // Generate nonce if not provided
  const authNonce = nonce || Math.random().toString(36).substring(2, 15);

  // Generate auth message
  const message = generateAuthMessage(address, authNonce);

  // Sign message
  const { signature } = await signMessage(provider, message);

  return {
    address,
    signature,
    message,
  };
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

/**
 * Check if wallet is available
 */
export function isWalletAvailable(type: 'phantom' | 'solflare' = 'phantom'): boolean {
  if (typeof window === 'undefined') return false;
  
  if (type === 'phantom') {
    return !!(window as any).solana?.isPhantom;
  }
  
  if (type === 'solflare') {
    return !!(window as any).solflare?.isSolflare;
  }
  
  return false;
}

/**
 * Open wallet website if not installed
 */
export function openWalletDownload(type: 'phantom' | 'solflare' = 'phantom'): void {
  const urls = {
    phantom: 'https://phantom.app/',
    solflare: 'https://solflare.com/',
  };
  
  window.open(urls[type], '_blank');
}
