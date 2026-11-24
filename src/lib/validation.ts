import { z } from "zod";

const passwordRule = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    email: z.string().trim().min(1, "Enter your work email").email("Enter a valid email address"),
    password: passwordRule,
    confirmPassword: z.string().min(1, "Confirm your password"),
    terms: z.literal(true, { message: "Accept the terms to continue" }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const forgotSchema = loginSchema.pick({ email: true });

export const resetSchema = z
  .object({ password: passwordRule, confirmPassword: z.string().min(1, "Confirm your password") })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const onboardingSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business name").max(120),
  website: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || /^(https?:\/\/)?[^\s.]+\.[^\s]+$/.test(v), "Enter a valid website"),
  industry: z.string().min(1, "Select an industry"),
  description: z.string().trim().max(1000),
  supportNeeds: z.array(z.string()).min(1, "Select at least one support need"),
  channels: z.array(z.string()).min(1, "Select at least one channel"),
});

export type FieldErrors = Record<string, string>;

export function flatten(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Only allow same-site relative redirects. */
export function safeNext(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
