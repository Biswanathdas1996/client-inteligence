import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  RotateCcw,
  Save,
  ShieldCheck,
  Zap,
} from "lucide-react";

import {
  CredentialSettings,
  clearSettings,
  loadSettings,
  saveSettings,
  settingsStatus,
} from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const PWC_DEFAULTS = {
  pwcGenAiBaseUrl: "https://genai-sharedservice-americas.pwc.com",
  pwcGenAiModel: "vertex_ai.gemini-2.5-flash-image",
};

interface SecretFieldProps {
  id: string;
  label: string;
  hint: string;
  value: string;
  placeholder: string;
  onChange: (next: string) => void;
}

function SecretField({
  id,
  label,
  hint,
  value,
  placeholder,
  onChange,
}: SecretFieldProps) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="text-[#2D2D2D] font-semibold text-sm tracking-wide"
        >
          {label}
        </Label>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="text-xs text-[#696969] hover:text-[#DC6900] flex items-center gap-1 transition-colors"
        >
          {revealed ? (
            <>
              <EyeOff className="h-3.5 w-3.5" /> Hide
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" /> Show
            </>
          )}
        </button>
      </div>
      <Input
        id={id}
        type={revealed ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="rounded-none border-[#E5E5E5] focus-visible:ring-[#DC6900] font-mono text-sm"
      />
      <p className="text-xs text-[#696969] leading-relaxed">{hint}</p>
    </div>
  );
}

interface PlainFieldProps {
  id: string;
  label: string;
  hint: string;
  value: string;
  placeholder: string;
  onChange: (next: string) => void;
}

function PlainField({
  id,
  label,
  hint,
  value,
  placeholder,
  onChange,
}: PlainFieldProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-[#2D2D2D] font-semibold text-sm tracking-wide"
      >
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="rounded-none border-[#E5E5E5] focus-visible:ring-[#DC6900] font-mono text-sm"
      />
      <p className="text-xs text-[#696969] leading-relaxed">{hint}</p>
    </div>
  );
}

function StatusPill({
  configured,
  label,
}: {
  configured: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 border text-xs font-semibold tracking-wide uppercase ${
        configured
          ? "border-[#DC6900] bg-[#FFF7EE] text-[#DC6900]"
          : "border-[#E5E5E5] bg-[#FAFAFA] text-[#696969]"
      }`}
    >
      {configured ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <KeyRound className="h-4 w-4" />
      )}
      <span>
        {label}: {configured ? "Configured" : "Not set"}
      </span>
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const [form, setForm] = useState<CredentialSettings>(() => loadSettings());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(loadSettings());
  }, []);

  const status = settingsStatus(form);

  const update = (patch: Partial<CredentialSettings>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      saveSettings(form);
      toast({
        title: "Credentials saved",
        description:
          "Your API keys are stored securely in this browser only and used to authenticate model calls.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    clearSettings();
    setForm(loadSettings());
    toast({
      title: "Credentials cleared",
      description: "All saved API keys have been removed from this browser.",
    });
  };

  return (
    <div className="flex-1 overflow-auto bg-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-10 md:py-14">
        <div className="flex items-start justify-between mb-8 border-b border-[#E5E5E5] pb-6">
          <div>
            <div className="text-xs font-semibold tracking-[0.2em] text-[#DC6900] uppercase mb-2">
              Workspace Configuration
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#2D2D2D]">
              Credentials & Model Settings
            </h1>
            <p className="text-[#696969] mt-3 max-w-2xl text-sm leading-relaxed">
              Provide the API credentials used to power live market research and
              executive-grade synthesis. Keys are stored locally in this browser
              and transmitted only to the PwC Client Intelligence backend on the
              calls that require them.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <StatusPill
            configured={status.pwcGenAiConfigured}
            label="PwC Gen AI"
          />
          <StatusPill
            configured={status.perplexityConfigured}
            label="Perplexity"
          />
        </div>

        <form onSubmit={handleSave} className="space-y-10">
          <section className="bg-white border border-[#E5E5E5] p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-3 mb-6">
              <div className="h-8 w-1 bg-[#DC6900] mt-1" />
              <div>
                <h2 className="text-lg font-bold text-[#2D2D2D]">
                  PwC Gen AI
                </h2>
                <p className="text-xs text-[#696969] mt-1">
                  Primary reasoning model used for executive synthesis,
                  pain-point identification, and solution mapping.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <button
                type="button"
                onClick={() => update(PWC_DEFAULTS)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#DC6900] border border-[#DC6900]/30 bg-[#FFF7EE] px-3 py-1.5 hover:bg-[#FFE8CC] transition-colors"
              >
                <Zap className="h-3.5 w-3.5" />
                Fill PwC Americas defaults
              </button>

              <SecretField
                id="pwc-key"
                label="API Key"
                placeholder="sk-..."
                hint='Bearer token (and x-api-key) issued by the PwC Gen AI platform. The key must start with "sk-".'
                value={form.pwcGenAiApiKey}
                onChange={(v) => update({ pwcGenAiApiKey: v })}
              />
              <PlainField
                id="pwc-base-url"
                label="API Base URL"
                placeholder="https://genai-sharedservice-americas.pwc.com"
                hint='Base URL only — do not include "/chat/completions". Example: https://genai-sharedservice-americas.pwc.com'
                value={form.pwcGenAiBaseUrl}
                onChange={(v) => update({ pwcGenAiBaseUrl: v })}
              />
              <PlainField
                id="pwc-model"
                label="Model"
                placeholder="vertex_ai.gemini-2.5-flash-image"
                hint="Model identifier available on the configured endpoint."
                value={form.pwcGenAiModel}
                onChange={(v) => update({ pwcGenAiModel: v })}
              />
            </div>
          </section>

          <section className="bg-white border border-[#E5E5E5] p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-3 mb-6">
              <div className="h-8 w-1 bg-[#FFB600] mt-1" />
              <div>
                <h2 className="text-lg font-bold text-[#2D2D2D]">
                  Perplexity
                </h2>
                <p className="text-xs text-[#696969] mt-1">
                  Web research API used to pull the latest earnings, filings,
                  and market signals before synthesis.
                </p>
              </div>
            </div>

            <SecretField
              id="perplexity-key"
              label="API Key"
              placeholder="pplx-..."
              hint="Used to retrieve up-to-date market intelligence with citations. When unset, the report is generated from the model's training data only."
              value={form.perplexityApiKey}
              onChange={(v) => update({ perplexityApiKey: v })}
            />
          </section>

          <section className="border border-[#E5E5E5] bg-white p-5 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-[#DC6900] shrink-0 mt-0.5" />
            <div className="text-xs text-[#696969] leading-relaxed">
              <strong className="text-[#2D2D2D]">Local-only storage.</strong>{" "}
              Credentials are persisted in this browser via{" "}
              <code className="text-[#2D2D2D]">localStorage</code> and attached
              as request headers when generating a report. They are never
              written to disk on the server, never logged, and never shared
              across sessions on other devices.
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-[#E5E5E5] pt-6">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-[#696969] hover:text-[#A32020] flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Clear all credentials
            </button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-none bg-[#DC6900] hover:bg-[#c25d00] text-white h-11 px-8 font-bold tracking-wide"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save credentials
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
