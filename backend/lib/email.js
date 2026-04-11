import { Resend } from 'resend'

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

export async function sendConfirmationEmail(registration) {
  const apiKey = getRequiredEnv('RESEND_API_KEY')
  const from = getRequiredEnv('RESEND_FROM_EMAIL')

  const resend = new Resend(apiKey)

  const subject = 'EXIT Registration Received'
  const text = [
    `Hi ${registration.name},`,
    '',
    'We received your EXIT coach registration submission.',
    'Our team will review your registration and follow up if needed.',
    '',
    'Thank you,',
    'EXIT Team'
  ].join('\n')

  await resend.emails.send({
    from,
    to: registration.email,
    subject,
    text,
    html: `<p>Hi ${registration.name},</p><p>We received your EXIT coach registration submission.</p><p>Our team will review your registration and follow up if needed.</p><p>Thank you,<br/>EXIT Team</p>`
  })
}
