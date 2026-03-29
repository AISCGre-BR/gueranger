import { safeStorage } from "electron";
import { Conf } from "electron-conf";

let settings: InstanceType<typeof Conf> | null = null;

function getSettings() {
  if (!settings) {
    settings = new Conf();
  }
  return settings;
}

function isEncryptionAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

export function storeEncrypted(key: string, value: string): void {
  if (!isEncryptionAvailable()) {
    throw new Error(
      "Secure storage is not available. On Linux, install and enable a keyring service (gnome-keyring, KWallet, or similar).",
    );
  }
  if (safeStorage.getSelectedStorageBackend() === "basic_text") {
    console.warn(
      "[credentials] safeStorage using basic_text backend -- data less secure.",
    );
  }
  const encrypted = safeStorage.encryptString(value);
  getSettings().set(key, encrypted.toString("base64"));
}

export function retrieveEncrypted(key: string): string | null {
  if (!isEncryptionAvailable()) return null;
  const stored = getSettings().get(key) as string | undefined;
  if (!stored) return null;
  try {
    const buffer = Buffer.from(stored, "base64");
    return safeStorage.decryptString(buffer);
  } catch {
    console.warn("[credentials] Failed to decrypt", key);
    return null;
  }
}

export function clearEncrypted(key: string): void {
  getSettings().delete(key);
}
