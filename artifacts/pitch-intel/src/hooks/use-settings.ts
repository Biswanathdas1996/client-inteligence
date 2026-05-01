import { useEffect, useState } from "react";
import {
  CredentialSettings,
  loadSettings,
  settingsStatus,
} from "@/lib/settings";

export function useSettings(): CredentialSettings {
  const [settings, setSettings] = useState<CredentialSettings>(() =>
    loadSettings(),
  );

  useEffect(() => {
    const refresh = () => setSettings(loadSettings());
    window.addEventListener("pwc-credentials-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("pwc-credentials-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return settings;
}

export function useSettingsStatus() {
  const settings = useSettings();
  return settingsStatus(settings);
}
