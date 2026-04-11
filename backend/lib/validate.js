import { z } from 'zod'

const registrationSchema = z
  .object({
    email: z.string().trim().email(),
    name: z.string().trim().min(1).max(120),
    phoneNumber: z.string().trim().min(7).max(40),
    mailingAddress: z.string().trim().min(3).max(240),
    password: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
    honeypot: z.string().optional().default('')
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match.'
      })
    }
  })

export function parseRegistrationInput(input) {
  const parsed = registrationSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      error: 'Invalid registration payload.',
      details: parsed.error.flatten()
    }
  }

  const normalizedPhone = parsed.data.phoneNumber.replace(/[^\d+\-()\s]/g, '').replace(/\s+/g, ' ').trim()

  return {
    ok: true,
    value: {
      email: parsed.data.email,
      name: parsed.data.name,
      phoneNumber: normalizedPhone,
      mailingAddress: parsed.data.mailingAddress,
      password: parsed.data.password,
      confirmPassword: parsed.data.confirmPassword,
      honeypot: parsed.data.honeypot
    }
  }
}
