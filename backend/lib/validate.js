import { z } from 'zod'

const gradeOptions = ['6', '7', '8', '9', '10', '11', '12', 'Postgraduate', 'Other']
const backgroundLevelOptions = ['Beginner', 'Intermediate', 'Advanced', 'Competitive']
const eventInterestOptions = ['In person', 'Virtual', 'Both']

const registrationSchema = z
  .object({
    email: z.string().trim().email(),
    firstName: z.string().trim().max(80).optional(),
    lastName: z.string().trim().max(80).optional(),
    name: z.string().trim().max(160).optional(),
    phoneNumber: z
      .string()
      .trim()
      .max(40)
      .optional()
      .default('')
      .refine(value => !value || value.replace(/\D/g, '').length >= 10, {
        message: 'Enter a valid phone number.'
      }),
    school: z.string().trim().max(140).optional(),
    cityStateCountry: z.string().trim().max(240).optional(),
    grade: z.enum(gradeOptions).optional(),
    backgroundLevel: z.enum(backgroundLevelOptions).optional(),
    eventInterest: z.enum(eventInterestOptions).optional(),
    mailingAddress: z.string().trim().max(240).optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    honeypot: z.string().optional().default('')
  })
  .superRefine((value, ctx) => {
    const hasFirstName = Boolean(value.firstName?.trim())
    const hasLastName = Boolean(value.lastName?.trim())
    const hasLegacyName = Boolean(value.name?.trim())
    const hasLegacyAddress = Boolean(value.mailingAddress?.trim())
    const hasLegacyPasswordFields = Boolean(value.password || value.confirmPassword)
    const isLegacyShape = hasLegacyAddress || hasLegacyPasswordFields

    if (!hasLegacyName && (!hasFirstName || !hasLastName)) {
      if (!hasFirstName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['firstName'],
          message: 'First name is required.'
        })
      }

      if (!hasLastName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lastName'],
          message: 'Last name is required.'
        })
      }
    }

    if (!isLegacyShape) {
      if (!value.school?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['school'],
          message: 'School is required.'
        })
      }

      if (!value.cityStateCountry?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cityStateCountry'],
          message: 'City, state/province, and country are required.'
        })
      }

      if (!value.grade) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['grade'],
          message: 'Grade is required.'
        })
      }

      if (!value.backgroundLevel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['backgroundLevel'],
          message: 'Background level is required.'
        })
      }

      if (!value.eventInterest) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['eventInterest'],
          message: 'Event interest is required.'
        })
      }
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

  const normalizedPhone = (parsed.data.phoneNumber ?? '')
    .replace(/[^\d+\-()\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const legacyNameParts = (parsed.data.name ?? '').trim().split(/\s+/).filter(Boolean)
  const fallbackFirstName = legacyNameParts[0] ?? ''
  const fallbackLastName = legacyNameParts.slice(1).join(' ')
  const normalizedFirstName = parsed.data.firstName?.trim() || fallbackFirstName
  const normalizedLastName = parsed.data.lastName?.trim() || fallbackLastName
  const isLegacyShape = Boolean(parsed.data.mailingAddress?.trim()) || Boolean(parsed.data.password || parsed.data.confirmPassword)
  const normalizedSchool = parsed.data.school?.trim() || (isLegacyShape ? 'Legacy Submission' : '')
  const normalizedCityStateCountry = parsed.data.cityStateCountry?.trim() || parsed.data.mailingAddress?.trim() || ''
  const normalizedGrade = parsed.data.grade || (isLegacyShape ? 'Other' : '')
  const normalizedBackgroundLevel = parsed.data.backgroundLevel || (isLegacyShape ? 'Beginner' : '')
  const normalizedEventInterest = parsed.data.eventInterest || (isLegacyShape ? 'Both' : '')

  return {
    ok: true,
    value: {
      email: parsed.data.email,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      phoneNumber: normalizedPhone,
      school: normalizedSchool,
      cityStateCountry: normalizedCityStateCountry,
      grade: normalizedGrade,
      backgroundLevel: normalizedBackgroundLevel,
      eventInterest: normalizedEventInterest,
      honeypot: parsed.data.honeypot
    }
  }
}
