import nodemailer from 'nodemailer'

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

export async function sendConfirmationEmail(registration) {
  const user = getRequiredEnv('GMAIL_USER')
  const appPassword = getRequiredEnv('GMAIL_APP_PASSWORD')
  const from = process.env.GMAIL_FROM_EMAIL || user

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass: appPassword
    }
  })

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

  const result = await transporter.sendMail({
    from,
    to: registration.email,
    subject,
    text,
    html: `<p>Hi ${fullName},</p><p>We received your EXIT coach registration submission.</p><p><strong>School:</strong> ${registration.school}<br/><strong>Location:</strong> ${registration.cityStateCountry}<br/><strong>Grade:</strong> ${registration.grade}<br/><strong>Background Level:</strong> ${registration.backgroundLevel}<br/><strong>Event Interest:</strong> ${registration.eventInterest}</p><p>Our team will review your registration and follow up if needed.</p><p>Thank you,<br/>EXIT Team</p>`
  })

  const accepted = Array.isArray(result.accepted) ? result.accepted : []
  const rejected = Array.isArray(result.rejected) ? result.rejected : []

  if (accepted.length === 0 || rejected.length > 0) {
    const rejectedList = rejected.map(value => String(value)).join(', ')
    if (rejectedList) {
      throw new Error(`Gmail rejected recipients: ${rejectedList}`)
    }
    throw new Error('Gmail did not accept the recipient.')
  }
}
