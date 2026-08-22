import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || 'fallback_secret_must_be_32_bytes_long_string!!';

function getDerivedKey(): Buffer {
  return crypto.scryptSync(SECRET_KEY, 'aurasend_salt', 32);
}

/**
 * Encrypts plain text string using AES-256-GCM
 */
export function encryptSecret(plainText: string | null | undefined): string | null {
  if (!plainText) return null;
  try {
    const iv = crypto.randomBytes(16);
    const key = getDerivedKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (e) {
    console.error('Encryption failed:', e);
    return null;
  }
}

/**
 * Decrypts AES-256-GCM ciphertext
 */
export function decryptSecret(cipherText: string | null | undefined): string | null {
  if (!cipherText) return null;
  // If text is not in encrypted format (legacy plain text), return as is
  if (!cipherText.includes(':')) return cipherText;

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return cipherText;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getDerivedKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (e) {
    // Return original string if decryption fails (e.g. legacy plain text)
    return cipherText;
  }
}
