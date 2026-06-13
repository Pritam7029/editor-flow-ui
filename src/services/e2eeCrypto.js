import { openDB } from 'idb';

const DB_NAME = 'editorflow_e2ee';
const STORE_NAME = 'keys';

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

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

// IndexedDB key accessors
export async function getLocalDeviceKeyId() {
  const db = await getDB();
  return db.get(STORE_NAME, 'deviceKeyId');
}

export async function setLocalDeviceKeyId(id) {
  const db = await getDB();
  await db.put(STORE_NAME, id, 'deviceKeyId');
}

export async function getLocalPrivateKey() {
  const db = await getDB();
  return db.get(STORE_NAME, 'privateKey');
}

export async function getLocalPublicKey() {
  const db = await getDB();
  return db.get(STORE_NAME, 'publicKey');
}

export async function storeLocalKeyPair(privateKey, publicKey) {
  const db = await getDB();
  await db.put(STORE_NAME, privateKey, 'privateKey');
  await db.put(STORE_NAME, publicKey, 'publicKey');
}

export async function clearLocalKeys() {
  const db = await getDB();
  await db.delete(STORE_NAME, 'privateKey');
  await db.delete(STORE_NAME, 'publicKey');
  await db.delete(STORE_NAME, 'deviceKeyId');
}

// Crypto: Generate RSA-OAEP Key Pair
export async function generateDeviceKeyPair() {
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
export async function wrapWorkspaceKey(aesKey, rsaPublicKey) {
  const wrappedBuffer = await window.crypto.subtle.wrapKey(
    'raw',
    aesKey,
    rsaPublicKey,
    {
      name: 'RSA-OAEP',
    }
  );
  return arrayBufferToBase64(wrappedBuffer);
}

// Crypto: Unwrap AES key with RSA-OAEP private key
export async function unwrapWorkspaceKey(wrappedBase64, rsaPrivateKey) {
  const wrappedBuffer = base64ToArrayBuffer(wrappedBase64);
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

// Crypto: Encrypt text with AES-GCM workspace key
export async function encryptText(text, aesKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(text);
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    plaintextBytes
  );
  
  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv),
  };
}

// Crypto: Decrypt ciphertext with AES-GCM workspace key
export async function decryptText(ciphertextBase64, ivBase64, aesKey) {
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);
  const iv = base64ToArrayBuffer(ivBase64);
  
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
