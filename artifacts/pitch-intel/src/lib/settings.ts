export interface CredentialSettings {
  perplexityApiKey: string;
  pwcGenAiApiKey: string;
  pwcGenAiBaseUrl: string;
  pwcGenAiModel: string;
}

const STORAGE_KEY = "pwc-client-intel.credentials";

const DEFAULTS: CredentialSettings = {
  perplexityApiKey: "",
  pwcGenAiApiKey: "",
  pwcGenAiBaseUrl: "",
  pwcGenAiModel: "",
};

export function loadSettings(): CredentialSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<CredentialSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: CredentialSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event("pwc-credentials-updated"));
}

export function clearSettings(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("pwc-credentials-updated"));
}

export function buildCredentialHeaders(
  settings: CredentialSettings = loadSettings(),
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (settings.perplexityApiKey.trim()) {
    headers["x-perplexity-key"] = settings.perplexityApiKey.trim();
  }
  if (settings.pwcGenAiApiKey.trim()) {
    headers["x-pwc-genai-key"] = settings.pwcGenAiApiKey.trim();
  }
  if (settings.pwcGenAiBaseUrl.trim()) {
    headers["x-pwc-genai-base-url"] = settings.pwcGenAiBaseUrl.trim();
  }
  if (settings.pwcGenAiModel.trim()) {
    headers["x-pwc-genai-model"] = settings.pwcGenAiModel.trim();
  }
  return headers;
}

export function settingsStatus(settings: CredentialSettings = loadSettings()) {
  return {
    perplexityConfigured: settings.perplexityApiKey.trim().length > 0,
    pwcGenAiConfigured: settings.pwcGenAiApiKey.trim().length > 0,
    anyConfigured:
      settings.perplexityApiKey.trim().length > 0 ||
      settings.pwcGenAiApiKey.trim().length > 0,
  };
}
