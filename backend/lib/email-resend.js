import { Resend } from 'resend'

let resendClient

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

  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }

  const fullName = [registration.firstName, registration.lastName]
    .map(value => String(value ?? '').trim())
    .filter(Boolean)
    .join(' ') || 'there'

  const subject = 'EXIT Registration Received'
  const text = [
    `Hi ${fullName},`,
    '',
    'We received your EXIT coach registration submission.',
    `School: ${registration.school}`,
    `Location: ${registration.cityStateCountry}`,
    `Grade: ${registration.grade}`,
    `Background Level: ${registration.backgroundLevel}`,
    `Event Interest: ${registration.eventInterest}`,
    'Our team will review your registration and follow up if needed.',
    '',
    'Thank you,',
    'EXIT Team'
  ].join('\n')

  const sendStartedAt = Date.now()

  const result = await resendClient.emails.send({
    from,
    to: registration.email,
    subject,
    text,
    html: `<p>Hi ${fullName},</p><p>We received your EXIT registration submission.</p>
      <p><strong>School:</strong> ${registration.school}<br/>
      <strong>Location:</strong> ${registration.cityStateCountry}<br/>
      <strong>Grade:</strong> ${registration.grade}<br/>
      <strong>Background Level:</strong> ${registration.backgroundLevel}<br/>
      <strong>Event Interest:</strong> ${registration.eventInterest}</p>
      <p>Our team will review your registration and follow up if needed.</p>
    <p>Thank you,<br/>EXIT Team</p>`
  })

  if (result?.error) {
    const providerMessage = typeof result.error.message === 'string'
      ? result.error.message
      : 'Unknown email provider error.'
    throw new Error(`Resend: ${providerMessage}`)
  }

  console.log('Resend confirmation email sent', {
    email: registration.email,
    durationMs: Date.now() - sendStartedAt,
    id: result?.data?.id ?? null
  })
}
