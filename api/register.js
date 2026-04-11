import { appendRegistrationRow } from '../backend/lib/sheets.js'
import { sendConfirmationEmail } from '../backend/lib/email.js'
import { parseRegistrationInput } from '../backend/lib/validate.js'

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(body))
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() || ''
  }
  return req.socket?.remoteAddress || ''
}

export default async function handler(req, res) {
  res.setHeader('Allow', 'POST')

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method Not Allowed' })
  }

  const parsed = parseRegistrationInput(req.body)
  if (!parsed.ok) {
    return json(res, 400, {
      error: parsed.error,
      details: parsed.details
    })
  }

  const registration = {
    ...parsed.value,
    ipAddress: getClientIp(req)
  }

  if (registration.honeypot && registration.honeypot.trim().length > 0) {
    return json(res, 202, { ok: true })
  }

  try {
    const sheetResult = await appendRegistrationRow(registration)

    let emailSent = true
    try {
      await sendConfirmationEmail(registration)
    } catch {
      emailSent = false
    }

    return json(res, 200, {
      ok: true,
      storedAt: sheetResult.timestamp,
      emailSent
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    return json(res, 500, {
      error: 'Failed to process registration.',
      detail: message
    })
  }
}
