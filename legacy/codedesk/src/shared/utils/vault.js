//Vault:
import { gcm } from "@noble/ciphers/aes";
import { bytesToUtf8, utf8ToBytes } from "@noble/ciphers/utils";
import { randomBytes } from "@noble/ciphers/webcrypto";
import { scryptAsync } from "@noble/hashes/scrypt";

export const VAULT_VERSION = 1;
const KDF = { N: 2 ** 15, r: 8, p: 1 };
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const toBase64 = (bytes) => {
  let text = "";
  for (let index = 0; index < bytes.length; index += 1) text += String.fromCharCode(bytes[index]);
  return btoa(text);
};

export const fromBase64 = (text) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

const deriveKey = (secret, salt, kdf = KDF) =>
  scryptAsync(utf8ToBytes(String(secret).normalize("NFKC")), salt, { ...kdf, dkLen: 32 });

const seal = (key, bytes) => {
  const iv = randomBytes(12);
  const cipher = gcm(key, iv).encrypt(bytes);
  const output = new Uint8Array(iv.length + cipher.length);
  output.set(iv);
  output.set(cipher, iv.length);
  return toBase64(output);
};

const open = (key, text) => {
  const data = fromBase64(text);
  return gcm(key, data.subarray(0, 12)).decrypt(data.subarray(12));
};

const wrapKey = async (secret, dataKey, kdf = KDF) => {
  const salt = randomBytes(16);
  const keyKey = await deriveKey(secret, salt, kdf);
  return { salt: toBase64(salt), key: seal(keyKey, dataKey) };
};

const unwrapKey = async (secret, slot, kdf) => {
  const keyKey = await deriveKey(secret, fromBase64(slot.salt), kdf);
  return open(keyKey, slot.key);
};

export const normalizeRecoveryCode = (code) =>
  String(code || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const createRecoveryCode = () => {
  const bytes = randomBytes(20);
  const chars = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
  return chars.match(/.{5}/g).join("-");
};

export const createVault = async (password) => {
  const dataKey = randomBytes(32);
  const recoveryCode = createRecoveryCode();
  const vault = {
    v: VAULT_VERSION,
    kdf: KDF,
    master: await wrapKey(password, dataKey),
    recovery: await wrapKey(normalizeRecoveryCode(recoveryCode), dataKey),
    createdAt: Date.now(),
  };
  return { vault, dataKey, recoveryCode };
};

export const unlockVault = (vault, password) => unwrapKey(password, vault.master, vault.kdf);

export const recoverVault = async (vault, recoveryCode, newPassword) => {
  const dataKey = await unwrapKey(normalizeRecoveryCode(recoveryCode), vault.recovery, vault.kdf);
  return {
    dataKey,
    vault: {
      ...vault,
      master: await wrapKey(newPassword, dataKey, vault.kdf),
      updatedAt: Date.now(),
    },
  };
};

export const encryptJson = (dataKey, value) => seal(dataKey, utf8ToBytes(JSON.stringify(value)));

export const decryptJson = (dataKey, text) => JSON.parse(bytesToUtf8(open(dataKey, text)));

export const getPasswordStrength = (password) => {
  const value = String(password || "");
  if (!value) return 0;
  let score = 0;
  if (value.length >= 10) score += 1;
  if (value.length >= 14) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(4, Math.max(1, score - (value.length < 10 ? 1 : 0)));
};