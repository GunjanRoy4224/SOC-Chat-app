function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function generateRSAKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

  return {
    publicKey: JSON.stringify(publicKeyJwk),
    privateKey: JSON.stringify(privateKeyJwk)
  };
}

export async function generateAESKey() {
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const raw = await window.crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(raw);
}

export async function encryptRoomKey(aesKeyBase64, publicKeyJwkString) {
  if (!publicKeyJwkString) return null;
  const publicKeyJwk = JSON.parse(publicKeyJwkString);
  const publicKey = await window.crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  const aesKeyBuffer = base64ToArrayBuffer(aesKeyBase64);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    aesKeyBuffer
  );

  return arrayBufferToBase64(encrypted);
}

export async function decryptRoomKey(encryptedAesKeyBase64, privateKeyJwkString) {
  try {
    if (!encryptedAesKeyBase64 || !privateKeyJwkString) return null;
    const privateKeyJwk = JSON.parse(privateKeyJwkString);
    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      privateKeyJwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );

    const encryptedBuffer = base64ToArrayBuffer(encryptedAesKeyBase64);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedBuffer
    );

    return arrayBufferToBase64(decryptedBuffer);
  } catch (err) {
    console.error("Failed to decrypt room key", err);
    return null;
  }
}

export async function encryptMessage(text, aesKeyBase64) {
  if (!aesKeyBase64) return text; // Fallback if no key (shouldn't happen)
  const keyBuffer = base64ToArrayBuffer(aesKeyBase64);
  const key = await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encodedText
  );

  return arrayBufferToBase64(iv) + ":" + arrayBufferToBase64(ciphertext);
}

export async function decryptMessage(encryptedString, aesKeyBase64) {
  try {
    if (!aesKeyBase64 || !encryptedString) return encryptedString;
    const parts = encryptedString.split(":");
    if (parts.length !== 2) return encryptedString; // not encrypted or corrupted

    const iv = base64ToArrayBuffer(parts[0]);
    const ciphertext = base64ToArrayBuffer(parts[1]);

    const keyBuffer = base64ToArrayBuffer(aesKeyBase64);
    const key = await window.crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.error("Failed to decrypt message", err);
    return "[Encrypted Message]";
  }
}
