// Helper: Convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Crypto: Generate RSA-OAEP Key Pair for User
export async function generateUserKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    },
    true,
    ['wrapKey', 'unwrapKey']
  );
  return keyPair;
}

// Crypto: Export Public Key as JWK String
export async function exportPublicKeyJWK(publicKey) {
  const jwk = await window.crypto.subtle.exportKey('jwk', publicKey);
  return JSON.stringify(jwk);
}

// Crypto: Import Public Key from JWK String
export async function importPublicKeyJWK(jwkString) {
  const jwk = JSON.parse(jwkString);
  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['wrapKey']
  );
}

// Crypto: Derive wrapping key from Recovery Answer using PBKDF2
export async function deriveWrappingKeyFromAnswer(answer, saltBase64, iterations) {
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(answer),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64ToArrayBuffer(saltBase64),
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

// Crypto: Encrypt private key with derived wrapping key
export async function encryptPrivateKey(privateKey, wrappingKey) {
  const jwk = await window.crypto.subtle.exportKey('jwk', privateKey);
  const plainBytes = new TextEncoder().encode(JSON.stringify(jwk));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    wrappingKey,
    plainBytes
  );

  return {
    encryptedPrivateKey: arrayBufferToBase64(cipherBuffer),
    iv: arrayBufferToBase64(iv),
  };
}

// Crypto: Decrypt private key with derived wrapping key
export async function decryptPrivateKey(encryptedPrivateKeyBase64, ivBase64, wrappingKey) {
  const plainBytes = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: base64ToArrayBuffer(ivBase64),
    },
    wrappingKey,
    base64ToArrayBuffer(encryptedPrivateKeyBase64)
  );

  const jwk = JSON.parse(new TextDecoder().decode(plainBytes));

  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['unwrapKey']
  );
}

// Crypto: Generate AES-GCM symmetric workspace key
export async function generateWorkspaceKey() {
  return window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Crypto: Wrap AES key with RSA-OAEP public key
export async function encryptWorkspaceKeyForUser(workspaceKey, rsaPublicKey) {
  const wrappedBuffer = await window.crypto.subtle.wrapKey(
    'raw',
    workspaceKey,
    rsaPublicKey,
    {
      name: 'RSA-OAEP',
    }
  );
  return arrayBufferToBase64(wrappedBuffer);
}

// Crypto: Unwrap AES key with RSA-OAEP private key
export async function decryptWorkspaceKeyGrant(encryptedWorkspaceKeyBase64, rsaPrivateKey) {
  const wrappedBuffer = base64ToArrayBuffer(encryptedWorkspaceKeyBase64);
  return window.crypto.subtle.unwrapKey(
    'raw',
    wrappedBuffer,
    rsaPrivateKey,
    {
      name: 'RSA-OAEP',
    },
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Crypto: Encrypt text with AES-GCM workspace key (Chat)
export async function encryptChatMessage(plainText, aesKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plainText);
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    plaintextBytes
  );
  
  return {
    encryptedBody: arrayBufferToBase64(ciphertextBuffer),
    bodyIv: arrayBufferToBase64(iv),
  };
}

// Crypto: Decrypt ciphertext with AES-GCM workspace key (Chat)
export async function decryptChatMessage(encryptedBodyBase64, bodyIvBase64, aesKey) {
  const ciphertext = base64ToArrayBuffer(encryptedBodyBase64);
  const iv = base64ToArrayBuffer(bodyIvBase64);
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv),
    },
    aesKey,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// Convert CryptoKey to raw base64 (for backup/recovery if needed)
export async function exportRawSymmetricKey(aesKey) {
  const raw = await window.crypto.subtle.exportKey('raw', aesKey);
  return arrayBufferToBase64(raw);
}

// Import CryptoKey from raw base64
export async function importRawSymmetricKey(base64Key) {
  const rawBuffer = base64ToArrayBuffer(base64Key);
  return window.crypto.subtle.importKey(
    'raw',
    rawBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Aliases for compatibility
export { encryptChatMessage as encryptText, decryptChatMessage as decryptText };

