import { safeStorage } from "electron";
import { Conf } from "electron-conf";

let settings: InstanceType<typeof Conf> | null = null;

function getSettings() {
  if (!settings) {
    settings = new Conf();
  }
  return settings;
}

export function storeEncrypted(key: string, value: string): void {
  if (safeStorage.getSelectedStorageBackend() === "basic_text") {
    console.warn(
      "[credentials] safeStorage using basic_text backend -- data less secure.",
    );
  }
  const encrypted = safeStorage.encryptString(value);
  getSettings().set(key, encrypted.toString("base64"));
}

export function retrieveEncrypted(key: string): string | null {
  const stored = getSettings().get(key) as string | undefined;
  if (!stored) return null;
  const buffer = Buffer.from(stored, "base64");
  return safeStorage.decryptString(buffer);
}

export function clearEncrypted(key: string): void {
  getSettings().delete(key);
}
