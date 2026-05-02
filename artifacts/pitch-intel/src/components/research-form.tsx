import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, Loader2, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { generateResearch, KbSolution } from "@workspace/api-client-react";
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
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      country: "",
      persona: "",
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
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#2D2D2D] border-b border-[#E5E5E5] pb-2">Client Context</h2>
          
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#2D2D2D] font-semibold">Target Company</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Acme Corp" className="rounded-none border-[#E5E5E5] focus-visible:ring-[#DC6900]" {...field} />
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
                  <Input placeholder="e.g. United States" className="rounded-none border-[#E5E5E5] focus-visible:ring-[#DC6900]" {...field} />
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
                    <SelectTrigger className="rounded-none border-[#E5E5E5] focus:ring-[#DC6900]">
                      <SelectValue placeholder="Select persona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-none border-[#E5E5E5]">
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

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#2D2D2D] border-b border-[#E5E5E5] pb-2 mt-8">Strategic Focus</h2>
          <FormField
            control={form.control}
            name="topics"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#2D2D2D] font-semibold">Topics of Interest</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Claims, Underwriting, ESG"
                    className="rounded-none border-[#E5E5E5] focus-visible:ring-[#DC6900]"
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

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#2D2D2D] border-b border-[#E5E5E5] pb-2 mt-8">Knowledge Base</h2>
          <p className="text-sm text-[#696969]">Upload proprietary AI solutions (.csv or .xlsx) to map against generated pain points.</p>
          
          <div className="border border-dashed border-[#E5E5E5] p-6 text-center bg-[#FAFAFA] relative hover:bg-[#F0F0F0] transition-colors cursor-pointer">
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
            <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-3 text-xs text-[#696969]">
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
          <div className="mt-8 border border-[#E5E5E5] bg-[#FAFAFA] p-4 text-xs text-[#696969] leading-relaxed">
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
          className="w-full rounded-none bg-[#DC6900] hover:bg-[#c25d00] text-white h-12 font-bold tracking-wide mt-4"
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
          <Alert variant="destructive" className="rounded-none border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription>
              {generateResearchMutation.error instanceof Error
                ? generateResearchMutation.error.message
                : "An error occurred while generating the report. Please verify your inputs and try again."}
            </AlertDescription>
          </Alert>
        )}
      </form>
    </Form>
  );
}
