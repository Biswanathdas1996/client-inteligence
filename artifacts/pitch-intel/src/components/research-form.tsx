import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, Loader2, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { generateResearch, KbSolution } from "@workspace/api-client-react";
import { ApiError } from "@workspace/api-client-react/custom-fetch";
import { parseKbFile } from "@/lib/file-parser";
import { formSchema, FormValues } from "@/lib/schemas";
import { buildCredentialHeaders } from "@/lib/settings";
import { useSettingsStatus } from "@/hooks/use-settings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const PERSONAS = ["CFO", "COO", "CIO", "CRO", "CEO", "Other"];

interface UrlCheckFailureRow {
  url: string;
  status: number | null;
  reason: string;
}

function getUrlCheckFailures(err: unknown): UrlCheckFailureRow[] | null {
  if (!(err instanceof ApiError)) return null;
  if (err.status !== 422 || err.data == null || typeof err.data !== "object") {
    return null;
  }
  const raw = (err.data as Record<string, unknown>).urlCheckFailures;
  if (!Array.isArray(raw)) return null;
  const out: UrlCheckFailureRow[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.url !== "string") continue;
    out.push({
      url: row.url,
      status: typeof row.status === "number" ? row.status : null,
      reason: typeof row.reason === "string" ? row.reason : "Check failed",
    });
  }
  return out.length > 0 ? out : null;
}

interface ResearchFormProps {
  onSuccess: (data: any) => void;
}

export function ResearchForm({ onSuccess }: ResearchFormProps) {
  const { toast } = useToast();
  const credStatus = useSettingsStatus();
  const generateResearchMutation = useMutation({
    mutationFn: (data: Parameters<typeof generateResearch>[0]) =>
      generateResearch(data, { headers: buildCredentialHeaders() }),
  });
  
  const [kbSolutions, setKbSolutions] = useState<KbSolution[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsingFile, setParsingFile] = useState(false);

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      companyName: "",
      country: "",
      persona: "",
      productLine: "",
      topics: [],
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingFile(true);
    setFileName(file.name);
    try {
      const solutions = await parseKbFile(file);
      setKbSolutions(solutions);
      toast({
        title: "Knowledge Base Loaded",
        description: `Successfully parsed ${solutions.length} solutions.`,
      });
    } catch (err) {
      setFileName(null);
      toast({
        title: "Error Parsing File",
        description: err instanceof Error ? err.message : "Invalid file format",
        variant: "destructive",
      });
    } finally {
      setParsingFile(false);
    }
  };

  const onSubmit = (data: FormValues) => {
    generateResearchMutation.mutate(
      {
        companyName: data.companyName,
        country: data.country,
        persona: data.persona || undefined,
        productLine: data.productLine?.trim() || undefined,
        topics: data.topics,
        knowledgeBase: kbSolutions.length > 0 ? kbSolutions : undefined,
      },
      {
        onSuccess: (report) => {
          onSuccess(report);
        },
        onError: (err) => {
          toast({
            title: "Generation Failed",
            description:
              err instanceof Error
                ? err.message
                : "An error occurred while generating the report. Please verify your inputs and try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#696969] shrink-0">
              Client context
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-[#E8E8E8] via-[#E8E8E8] to-transparent" aria-hidden />
          </div>
          
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#2D2D2D] font-semibold">Target Company</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Acme Corp"
                    className="h-11 rounded-md border-[#E3E3E3] shadow-sm focus-visible:border-[#DC6900]/50 focus-visible:ring-[#DC6900]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#2D2D2D] font-semibold">Geography</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. United States"
                    className="h-11 rounded-md border-[#E3E3E3] shadow-sm focus-visible:border-[#DC6900]/50 focus-visible:ring-[#DC6900]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="persona"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#2D2D2D] font-semibold">Buyer Persona (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-md border-[#E3E3E3] shadow-sm focus:ring-[#DC6900]">
                      <SelectValue placeholder="Select persona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-lg border-[#E3E3E3] shadow-md">
                    {PERSONAS.map(p => (
                      <SelectItem key={p} value={p} className="focus:bg-[#FAFAFA] focus:text-[#DC6900]">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-5 mt-10">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#696969] shrink-0">
              Product line
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-[#E8E8E8] via-[#E8E8E8] to-transparent" aria-hidden />
          </div>
          <FormField
            control={form.control}
            name="productLine"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#2D2D2D] font-semibold">Product line (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Commercial P&C insurance, Cloud ERP, Retail banking"
                    className="h-11 rounded-md border-[#E3E3E3] shadow-sm focus-visible:border-[#DC6900]/50 focus-visible:ring-[#DC6900]"
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-[#696969] leading-relaxed">
                  When set, the generated report, live web search, peer comparison, AI solution mapping, financial discussion, and topic findings are scoped to this product line only. Leave blank for a whole-company view.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-5 mt-10">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#696969] shrink-0">
              Strategic focus
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-[#E8E8E8] via-[#E8E8E8] to-transparent" aria-hidden />
          </div>
          <FormField
            control={form.control}
            name="topics"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#2D2D2D] font-semibold">Topics of Interest</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Claims, Underwriting, ESG"
                    className="h-11 rounded-md border-[#E3E3E3] shadow-sm focus-visible:border-[#DC6900]/50 focus-visible:ring-[#DC6900]"
                    value={field.value?.join(", ") ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const parsed = raw
                        .split(",")
                        .map((t) => t.trim())
                        .filter((t) => t.length > 0);
                      field.onChange(parsed);
                    }}
                  />
                </FormControl>
                <p className="text-xs text-[#696969]">Separate multiple topics with commas.</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-5 mt-10">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#696969] shrink-0">
              Knowledge base
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-[#E8E8E8] via-[#E8E8E8] to-transparent" aria-hidden />
          </div>
          <p className="text-sm text-[#696969]">Upload proprietary AI solutions (.csv or .xlsx) to map against generated pain points.</p>
          
          <div className="border border-dashed border-[#D8D8D8] rounded-lg p-8 text-center bg-gradient-to-b from-[#FBFBFB] to-[#F6F6F6] relative hover:border-[#DC6900]/35 hover:bg-[#FAFAFA] transition-all cursor-pointer shadow-sm">
            <input 
              type="file" 
              accept=".csv,.xlsx,.xls" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={parsingFile || generateResearchMutation.isPending}
            />
            {parsingFile ? (
              <div className="flex flex-col items-center text-[#696969]">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <span className="text-sm">Parsing file...</span>
              </div>
            ) : fileName ? (
              <div className="flex flex-col items-center text-[#DC6900]">
                <CheckCircle2 className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">{fileName}</span>
                <span className="text-xs text-[#696969] mt-1">{kbSolutions.length} solutions detected</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-[#696969]">
                <FileUp className="h-6 w-6 mb-2" />
                <span className="text-sm">Click or drag file to upload</span>
              </div>
            )}
          </div>
          
          {kbSolutions.length > 0 && (
            <div className="rounded-md bg-[#FAFAFA] border border-[#E8E8E8] p-4 text-xs text-[#696969]">
              <div className="font-semibold text-[#2D2D2D] mb-1">Detected Solutions Preview:</div>
              <ul className="list-disc pl-4 space-y-1">
                {kbSolutions.slice(0, 3).map((sol, i) => (
                  <li key={i}>{sol.name || "Unnamed solution"}</li>
                ))}
                {kbSolutions.length > 3 && (
                  <li>...and {kbSolutions.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {!credStatus.pwcGenAiConfigured && (
          <div className="mt-8 rounded-lg border border-[#E8E8E8] bg-[#FAFBFC] p-5 text-xs text-[#696969] leading-relaxed shadow-sm">
            <div className="flex items-center gap-2 text-[#2D2D2D] font-semibold mb-1">
              <AlertCircle className="h-4 w-4 text-[#DC6900]" />
              No PwC Gen AI key configured
            </div>
            <p>
              Reports will be generated through the workspace default model.{" "}
              <Link
                href="/settings"
                className="text-[#DC6900] font-semibold hover:underline"
              >
                Add PwC and Perplexity credentials
              </Link>{" "}
              to route inference through approved infrastructure and enrich the
              report with live web research.
            </p>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full rounded-md bg-[#DC6900] hover:bg-[#c25d00] text-white h-12 text-[15px] font-semibold tracking-tight mt-6 shadow-md shadow-[#DC6900]/25"
          disabled={generateResearchMutation.isPending}
        >
          {generateResearchMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Synthesizing Intelligence...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" fill="currentColor" />
              Generate Strategy Report
            </>
          )}
        </Button>

        {generateResearchMutation.isError && (
          <Alert variant="destructive" className="rounded-lg border-red-500/80 bg-red-50/90">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                {generateResearchMutation.error instanceof Error
                  ? generateResearchMutation.error.message
                  : "An error occurred while generating the report. Please verify your inputs and try again."}
              </p>
              {generateResearchMutation.error &&
                (() => {
                  const failures = getUrlCheckFailures(generateResearchMutation.error);
                  if (!failures) return null;
                  return (
                    <div className="rounded-md border border-red-200 bg-white/80 p-3 text-left">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-900/80">
                        URLs that did not return HTTP 2xx ({failures.length})
                      </p>
                      <ul className="max-h-48 space-y-2 overflow-y-auto text-xs text-red-950/90">
                        {failures.map((f) => (
                          <li key={f.url} className="break-all">
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-[#DC6900] underline underline-offset-2"
                            >
                              {f.url}
                            </a>
                            <span className="block text-red-800/90">
                              {f.status != null ? `HTTP ${f.status}` : "No status"} · {f.reason}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[11px] leading-snug text-red-900/75">
                        These links are validated from the server (not your browser). Paywalls, bot blocking, or dead pages often fail. Try generating again, or ask your admin about{" "}
                        <code className="rounded bg-red-100/80 px-1">RESEARCH_SKIP_URL_VERIFICATION</code> for local debugging only.
                      </p>
                    </div>
                  );
                })()}
            </AlertDescription>
          </Alert>
        )}
      </form>
    </Form>
  );
}
