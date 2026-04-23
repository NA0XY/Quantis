import { z } from "zod";

export const requestSchema = z.object({
  mode: z.enum(["chat", "analyze", "recommend"]).default("chat"),
  message: z.string().max(4000).optional(),
  strategy: z.string().max(10000).optional(),
  portfolioData: z.record(z.string(), z.unknown()).optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(2000),
  })).max(20).default([]),
});

export type CoachRequestBody = z.infer<typeof requestSchema>;
