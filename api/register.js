const path = require('node:path')
const { pathToFileURL } = require('node:url')

const backendLibDirectory = path.resolve(__dirname, '../backend/lib')
let registrationModulesPromise

function getBackendModuleUrl(fileName) {
  return pathToFileURL(path.join(backendLibDirectory, fileName)).href
}

function loadRegistrationModules() {
  if (!registrationModulesPromise) {
    registrationModulesPromise = Promise.all([
      import(getBackendModuleUrl('sheets.js')),
      import(getBackendModuleUrl('validate.js'))
    ])
      .then(([sheetsModule, validateModule]) => ({
        appendRegistrationRow: sheetsModule.appendRegistrationRow,
        parseRegistrationInput: validateModule.parseRegistrationInput
      }))
      .catch(error => {
        registrationModulesPromise = undefined
        throw error
      })
  }

  return registrationModulesPromise
}

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(body))
}

function getHeaderValue(headers, name) {
  const value = headers[name]
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return typeof value === 'string' ? value : ''
}

function normalizeIp(value) {
  let normalized = value.trim()

  if (!normalized) {
    return ''
  }

  if (normalized.includes(',')) {
    normalized = normalized.split(',')[0]?.trim() || ''
  }

  if (normalized.startsWith('[') && normalized.endsWith(']')) {
    normalized = normalized.slice(1, -1)
  }

  if (normalized.startsWith('::ffff:')) {
    normalized = normalized.slice(7)
  }

  if (normalized === '::1') {
    return '127.0.0.1'
  }

  if (normalized.includes('.') && normalized.includes(':')) {
    const lastColon = normalized.lastIndexOf(':')
    const lastDot = normalized.lastIndexOf('.')
    if (lastColon > lastDot) {
      normalized = normalized.slice(0, lastColon)
    }
  }

  return normalized
}

function isLoopbackIp(value) {
  return value === '127.0.0.1' || value.startsWith('127.') || value === 'localhost' || value === '::1'
}

function getClientIp(req) {
  const headerCandidates = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'true-client-ip',
    'x-client-ip',
    'x-vercel-forwarded-for'
  ]
    .map(name => normalizeIp(getHeaderValue(req.headers, name)))
    .filter(Boolean)

  const socketIp = normalizeIp(req.socket?.remoteAddress || '')
  const candidates = [...headerCandidates, socketIp].filter(Boolean)
  const nonLoopback = candidates.find(ip => !isLoopbackIp(ip))

  return nonLoopback || candidates[0] || ''
}

module.exports = async function handler(req, res) {
  res.setHeader('Allow', 'POST')

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method Not Allowed' })
  }

  try {
    const { appendRegistrationRow, parseRegistrationInput } = await loadRegistrationModules()

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

    const sheetResult = await appendRegistrationRow(registration)

    return json(res, 200, {
      ok: true,
      storedAt: sheetResult.timestamp
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    console.error('Failed to process registration request', {
      message,
      stack: error instanceof Error ? error.stack : undefined
    })
    return json(res, 500, {
      error: 'Failed to process registration.',
      detail: message
    })
  }
}
