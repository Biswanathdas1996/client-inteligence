import * as z from "zod";

export const formSchema = z.object({
  companyName: z.string().min(1, "Company Name is required"),
  country: z.string().min(1, "Country / Geography is required"),
  persona: z.string().optional(),
  topics: z.array(z.string()).min(1, "Select at least one topic of interest"),
  knowledgeBase: z.any().optional(), // Will handle file via state
});

export type FormValues = z.infer<typeof formSchema>;
