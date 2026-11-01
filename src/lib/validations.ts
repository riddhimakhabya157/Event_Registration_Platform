import { z } from "zod";

export const ALLOWED_DOMAIN_INTERESTS = [
  "Web Development",
  "Artificial Intelligence",
  "Machine Learning",
  "Data Science",
  "Cybersecurity",
  "Cloud Computing",
  "Internet of Things",
  "UI/UX Design",
  "Blockchain",
] as const;

export const registrationSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required." })
    .trim()
    .min(2, { message: "Full name must be at least 2 characters." })
    .max(100, { message: "Full name must not exceed 100 characters." }),
  email: z
    .string({ required_error: "Email address is required." })
    .trim()
    .email({ message: "Please enter a valid email address." })
    .max(255, { message: "Email must not exceed 255 characters." }),
  collegeOrOrganization: z
    .string({ required_error: "College or organization is required." })
    .trim()
    .min(2, { message: "College or organization must be at least 2 characters." })
    .max(150, { message: "College or organization must not exceed 150 characters." }),
  interests: z
    .array(z.string(), {
      required_error: "Please select at least one domain interest.",
    })
    .min(1, { message: "Please select at least one domain interest." })
    .refine(
      (items) => items.every((item) => (ALLOWED_DOMAIN_INTERESTS as readonly string[]).includes(item)),
      { message: "One or more selected domain interests are invalid." }
    ),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
