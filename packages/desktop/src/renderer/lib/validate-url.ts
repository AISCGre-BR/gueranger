const ALLOWED_PROTOCOLS = ["https:", "http:"];

/** Returns true if the URL is safe to open externally (http/https only). */
export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}
