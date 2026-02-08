/**
 * Cryptographic Utilities
 * NACL signature generation for Agent Gateway authentication
 */

const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

/**
 * Generate Ed25519 keypair
 */
function generateKeyPair() {
  const keyPair = nacl.sign.keyPair();
  
  return {
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
    secretKey: naclUtil.encodeBase64(keyPair.secretKey),
  };
}

/**
 * Generate NACL signature for request authentication
 * @param {Object} payload - Request payload (will be JSON stringified)
 * @param {string} secretKeyBase64 - Base64 encoded secret key
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} url - Request URL path
 * @returns {string} Base64 encoded signature
 */
function generateNaclSignature(payload, secretKeyBase64, method = 'POST', url = '') {
  try {
    // Create message to sign: method + url + payload
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const message = `${method}:${url}:${payloadString}`;
    
    // Convert to bytes
    const messageBytes = naclUtil.decodeUTF8(message);
    const secretKeyBytes = naclUtil.decodeBase64(secretKeyBase64);
    
    // Sign message
    const signature = nacl.sign.detached(messageBytes, secretKeyBytes);
    
    // Return base64 encoded signature
    return naclUtil.encodeBase64(signature);
  } catch (error) {
    throw new Error(`Failed to generate signature: ${error.message}`);
  }
}

/**
 * Verify NACL signature (for testing)
 */
function verifyNaclSignature(payload, signatureBase64, publicKeyBase64, method = 'POST', url = '') {
  try {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const message = `${method}:${url}:${payloadString}`;
    
    const messageBytes = naclUtil.decodeUTF8(message);
    const signatureBytes = naclUtil.decodeBase64(signatureBase64);
    const publicKeyBytes = naclUtil.decodeBase64(publicKeyBase64);
    
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    return false;
  }
}

/**
 * Generate secure random string
 */
function generateRandomString(length = 32) {
  const bytes = nacl.randomBytes(length);
  return naclUtil.encodeBase64(bytes).slice(0, length);
}

module.exports = {
  generateKeyPair,
  generateNaclSignature,
  verifyNaclSignature,
  generateRandomString,
};
