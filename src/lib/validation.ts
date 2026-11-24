import { z } from "zod";
export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");
export const passwordSchema = z.string().min(8, "Use at least 8 characters.").regex(/[A-Za-z]/, "Include a letter.").regex(/[0-9]/, "Include a number.");
export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: emailSchema, password: passwordSchema, confirm: z.string(),
  terms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms." }) }),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match." });
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.") });
export const flatten = (e: import("zod").ZodError) => Object.fromEntries(e.issues.map((i) => [i.path[0] as string, i.message]));
