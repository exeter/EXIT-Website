import { google } from 'googleapis'

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

function normalizeMultilineSecret(value) {
  let normalized = value.trim()

  // Support .env values wrapped in quotes and escaped newlines.
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1)
  }

  normalized = normalized.replace(/\r\n/g, '\n').replace(/\\n/g, '\n').trim()

  if (!normalized.includes('BEGIN ') && !normalized.includes('END ')) {
    const compactBase64 = normalized.replace(/\s+/g, '')
    const chunks = compactBase64.match(/.{1,64}/g) ?? []
    return `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`
  }

  return normalized
}

function getGooglePrivateKey() {
  return normalizeMultilineSecret(getRequiredEnv('GOOGLE_PRIVATE_KEY'))
}

export async function appendRegistrationRow(row) {
  const clientEmail = getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL')
  const privateKey = getGooglePrivateKey()
  const sheetId = getRequiredEnv('GOOGLE_SHEET_ID')
  const range = process.env.GOOGLE_SHEET_RANGE || 'Signups!A:M'

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })

  const sheets = google.sheets({ version: 'v4', auth })

  const now = new Date().toISOString()
  const values = [
    [
      now,
      'v1',
      row.email,
      row.firstName,
      row.lastName,
      row.phoneNumber,
      row.school,
      row.cityStateCountry,
      row.grade,
      row.backgroundLevel,
      row.eventInterest,
      row.honeypot || '',
      row.ipAddress || ''
    ]
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: {
      values
    }
  })

  return { timestamp: now }
}
