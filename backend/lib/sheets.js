import { google } from 'googleapis'

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

function getGooglePrivateKey() {
  return getRequiredEnv('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n')
}

export async function appendRegistrationRow(row) {
  const clientEmail = getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL')
  const privateKey = getGooglePrivateKey()
  const sheetId = getRequiredEnv('GOOGLE_SHEET_ID')
  const range = process.env.GOOGLE_SHEET_RANGE || 'Signups!A:J'

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
      row.name,
      row.phoneNumber,
      row.mailingAddress,
      row.password,
      row.confirmPassword,
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
