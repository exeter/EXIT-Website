import eccLogoUrl from '../ECC Logo with E.svg'
import { mountNetworkCanvas } from './network-canvas.ts'
import './style.css'

type Route = '/' | '/schedule' | '/about' | '/register'

type RegistrationPayload = {
  email: string
  name: string
  phoneNumber: string
  mailingAddress: string
  password: string
  confirmPassword: string
  honeypot: string
}

type RegisterFieldName = keyof Omit<RegistrationPayload, 'honeypot'>

type ScheduleRow = {
  time: string
  title: string
  detail: string
  location: string
}

const eventSummary = {
  name: 'Exeter Informatics Tournament',
  shortName: 'EXIT',
  date: 'May 10, 2026',
  venue: 'Online',
  city: 'Hosted by ECC'
} as const

const schedule: readonly ScheduleRow[] = [
  {
    time: '8:30 - 9:00',
    title: 'Check-in',
    detail: 'Platform check, account access, and final setup.',
    location: 'Online'
  },
  {
    time: '9:00 - 9:20',
    title: 'Welcome + rules',
    detail: 'Opening remarks, format overview, and contest logistics.',
    location: 'Livestream'
  },
  {
    time: '9:30 - 10:45',
    title: 'Individual round',
    detail: '6 problems solved solo.',
    location: 'Contest platform'
  },
  {
    time: '10:45 - 11:00',
    title: 'Break',
    detail: 'Short reset before the team round begins.',
    location: 'Online'
  },
  {
    time: '11:00 - 12:30',
    title: 'Team round',
    detail: '8 problems solved collaboratively.',
    location: 'Contest platform'
  },
  {
    time: '12:30 - 1:15',
    title: 'Break + judging',
    detail: 'Short intermission while submissions are reviewed.',
    location: 'Online'
  },
  {
    time: '1:15 - 2:00',
    title: 'Community session',
    detail: 'Optional post-contest discussion and closing announcements.',
    location: 'Livestream'
  },
  {
    time: '2:15 - 3:00',
    title: 'Awards + closing',
    detail: 'Team and individual recognition, then wrap-up.',
    location: 'Livestream'
  }
] as const

const homeSections = [
  {
    label: 'General Information',
    title: 'Online and accessible.',
    body:
      'EXIT will be run online. Competitors can participate remotely, and all contest communication, announcements, and logistics will happen through the online event platform and organizer channels.',
    items: [
      'Open to middle and high school competitors',
      'Hosted by the Exeter Computing Club',
      'All times and announcements will be posted online'
    ]
  },
  {
    label: 'Format',
    title: 'Two rounds.',
    body:
      'The contest has one individual round followed by one team round. The individual round is solved alone; the team round is solved collaboratively with your registered teammates.',
    items: ['Individual round: 6 problems', 'Team round: 8 problems', 'Awards and closing after judging']
  },
  {
    label: 'Scoring',
    title: 'Scoring is still being finalized.',
    body:
      'The exact scoring system is TBD. We will publish the final scoring details before the contest begins so competitors know how individual and team standings will be determined.',
    items: ['Scoring: TBD', 'Final details will be announced before the contest', 'Separate individual and team recognition is expected']
  },
  {
    label: 'Rules',
    title: 'Standard contest expectations.',
    body:
      'The rules will follow standard competitive programming norms, similar in spirit to Codeforces-style contests, with a few important basics highlighted below.',
    items: [
      'No AI tools, code generation tools, or outside assistance',
      'No collaboration during the individual round',
      'During the team round, work only with your registered teammates',
      'Do not share problems, solutions, or live contest details publicly during the event',
      'Organizer decisions on rules and scoring are final'
    ]
  }
] as const

const directors = [
  { name: 'Aryan Patel', email: 'apatel@exeter.edu' },
  { name: 'Chris Spencer', email: 'cspencer1@exeter.edu' },
  { name: 'Maya Shah', email: 'mnshah@exeter.edu' },
  { name: 'Robert Joo', email: 'sjoo@exeter.edu' }
] as const

const appRoot = document.querySelector<HTMLDivElement>('#app')

if (!appRoot) {
  throw new Error('App root not found')
}

const app = appRoot
let cleanupCanvas: (() => void) | null = null

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getRoute(): Route {
  const hash = window.location.hash.replace(/^#/, '')

  if (hash === '/schedule' || hash === '/about' || hash === '/register') {
    return hash
  }

  return '/'
}

function navLink(route: Route, label: string, currentRoute: Route): string {
  const isActive = route === currentRoute ? ' is-active' : ''
  return `<a class="nav-link${isActive}" href="#${route}">${label}</a>`
}

function renderScheduleTable(): string {
  return schedule
    .map(
      row => `
        <div class="schedule-table-row">
          <div class="schedule-time">${escapeHtml(row.time)}</div>
          <div class="schedule-event">${escapeHtml(row.title)}</div>
          <div class="schedule-detail">${escapeHtml(row.detail)}</div>
          <div class="schedule-location">${escapeHtml(row.location)}</div>
        </div>`
    )
    .join('')
}

function renderDirectors(): string {
  return directors
    .map(
      director => `
        <article class="person-card">
          <h3>${escapeHtml(director.name)}</h3>
          <a class="person-email" href="mailto:${escapeHtml(director.email)}">${escapeHtml(director.email)}</a>
        </article>`
    )
    .join('')
}

function renderHomeSections(): string {
  return homeSections
    .map(
      section => `
        <article class="panel home-section-card">
          <p class="section-label">${escapeHtml(section.label)}</p>
          <h2>${escapeHtml(section.title)}</h2>
          <p class="punch">${escapeHtml(section.body)}</p>
          <ul class="fact-list">
            ${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </article>`
    )
    .join('')
}

function renderHomePage(): string {
  return `
    <section class="hero-banner panel panel-feature">
      <p class="section-label">Contest</p>
      <h1>${escapeHtml(eventSummary.name)}</h1>
      <p class="hero-lead">
        A student-run online informatics competition for middle and high school students.
      </p>
      <p class="hero-meta">
        ${escapeHtml(eventSummary.date)} · ${escapeHtml(eventSummary.venue)} · ${escapeHtml(eventSummary.city)}
      </p>
      <div class="hero-actions">
        <a class="button button-primary" href="#/schedule">View Schedule</a>
        <a class="button button-secondary" href="#/register">Register</a>
      </div>
    </section>

    <section class="home-sections-grid" aria-label="Contest details">
      ${renderHomeSections()}
    </section>
  `
}

function renderSchedulePage(): string {
  return `
    <section class="page-intro">
      <p class="section-label">Schedule</p>
      <h1>Schedule</h1>
      <p class="page-copy">
        The day is organized around two online competition rounds, a short break, and a closing session once judging is complete.
      </p>
    </section>

    <section class="panel schedule-card">
      <div class="schedule-table">
        <div class="schedule-table-head">
          <div>Time</div>
          <div>Session</div>
          <div>Notes</div>
          <div>Location</div>
        </div>
        ${renderScheduleTable()}
      </div>
    </section>
  `
}

function renderAboutPage(): string {
  return `
    <section class="page-intro">
      <p class="section-label">About Us</p>
      <h1>About Us</h1>
      <p class="page-copy">
        Exeter Computing Club runs EXIT as a student-led competition that aims to feel welcoming, thoughtful, and technically serious.
      </p>
    </section>

    <section class="detail-grid">
      <section class="panel panel-accent">
        <p class="section-label">Organization</p>
        <h2>What we are building.</h2>
        <p class="punch">
          We want EXIT to be a clean, well-run informatics event: approachable for first-time competitors,
          but still interesting for students who already enjoy algorithms and contest math.
        </p>
      </section>

      <section class="panel">
        <p class="section-label">Directors</p>
        <h2>Tournament directors</h2>
        <div class="people-grid">
          ${renderDirectors()}
        </div>
      </section>
    </section>
  `
}

function renderRegisterPage(): string {
  return `
    <section class="page-intro">
      <p class="section-label">Register</p>
      <h1>Sign Up</h1>
      <p class="page-copy">
        Each coach should sign up for exactly one account. Teams, students, and parents do not need to sign up.
      </p>
    </section>

    <section class="register-grid">
      <section class="panel panel-feature">
        <p class="section-label">Registration Details</p>
        <h2>Coach account registration.</h2>
        <p class="punch">
          If you are a student who would like to participate in EMCC, please contact your school's coach.
          If your school is not participating and you would like to participate as an individual,
          your parent or guardian can sign up as your coach.
        </p>
        <p class="register-login-text">Already have an account? You can <a href="#">log in here</a>.</p>
      </section>

      <section class="panel panel-accent register-form-panel" aria-label="Registration form">
        <form id="register-form" novalidate>
          <div class="form-stack">
            <div class="field-wrap">
              <input class="field" type="email" name="email" placeholder="Email *" autocomplete="email" required />
              <p class="error-msg" data-error-for="email"></p>
            </div>

            <div class="field-wrap">
              <input class="field" type="text" name="name" placeholder="Name *" autocomplete="name" required />
              <p class="error-msg" data-error-for="name"></p>
            </div>

            <div class="field-wrap">
              <input class="field" type="tel" name="phoneNumber" placeholder="Phone Number *" autocomplete="tel" required />
              <p class="error-msg" data-error-for="phoneNumber"></p>
            </div>

            <div class="field-wrap">
              <input class="field" type="text" name="mailingAddress" placeholder="Mailing Address *" autocomplete="street-address" required />
              <p class="error-msg" data-error-for="mailingAddress"></p>
            </div>

            <div class="field-wrap">
              <input class="field" type="password" name="password" placeholder="Password *" autocomplete="new-password" required />
              <p class="error-msg" data-error-for="password"></p>
            </div>

            <div class="field-wrap">
              <input class="field" type="password" name="confirmPassword" placeholder="Confirm Password *" autocomplete="new-password" required />
              <p class="error-msg" data-error-for="confirmPassword"></p>
            </div>

            <input type="text" name="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" hidden />

            <div class="actions">
              <button class="button button-primary register-submit" type="submit">SIGN UP</button>
            </div>
          </div>
        </form>

        <p class="status" id="register-status" aria-live="polite"></p>
        <p class="register-confirm-copy">You should receive a confirmation email once you have signed up successfully.</p>
      </section>
    </section>
  `
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+\-()\s]/g, '').replace(/\s+/g, ' ').trim()
}

function validateRegistration(payload: RegistrationPayload): Partial<Record<RegisterFieldName, string>> {
  const errors: Partial<Record<RegisterFieldName, string>> = {}

  if (!payload.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!payload.name.trim()) {
    errors.name = 'Name is required.'
  }

  if (!payload.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone number is required.'
  } else if (payload.phoneNumber.replace(/\D/g, '').length < 10) {
    errors.phoneNumber = 'Enter a valid phone number.'
  }

  if (!payload.mailingAddress.trim()) {
    errors.mailingAddress = 'Mailing address is required.'
  }

  if (!payload.password) {
    errors.password = 'Password is required.'
  } else if (payload.password.length < 8) {
    errors.password = 'Use at least 8 characters.'
  }

  if (!payload.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (payload.password !== payload.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

function setupRegisterForm() {
  const form = document.querySelector<HTMLFormElement>('#register-form')
  const statusNode = document.querySelector<HTMLParagraphElement>('#register-status')

  if (!form || !statusNode) {
    return
  }

  const registerForm = form
  const registerStatusNode = statusNode

  const fields: RegisterFieldName[] = [
    'email',
    'name',
    'phoneNumber',
    'mailingAddress',
    'password',
    'confirmPassword'
  ]

  function setFieldError(name: RegisterFieldName, message?: string) {
    const input = registerForm.elements.namedItem(name) as HTMLInputElement | null
    const msg = registerForm.querySelector<HTMLParagraphElement>(`[data-error-for="${name}"]`)

    if (!input || !msg) {
      return
    }

    input.setAttribute('aria-invalid', message ? 'true' : 'false')
    msg.textContent = message ?? ''
  }

  function setStatus(message: string, kind: 'idle' | 'success' | 'error') {
    registerStatusNode.textContent = message
    registerStatusNode.dataset.kind = kind
  }

  let isSubmitting = false

  registerForm.addEventListener('submit', async event => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const formData = new FormData(registerForm)

    const payload: RegistrationPayload = {
      email: String(formData.get('email') ?? '').trim(),
      name: String(formData.get('name') ?? '').trim(),
      phoneNumber: normalizePhone(String(formData.get('phoneNumber') ?? '')),
      mailingAddress: String(formData.get('mailingAddress') ?? '').trim(),
      password: String(formData.get('password') ?? ''),
      confirmPassword: String(formData.get('confirmPassword') ?? ''),
      honeypot: String(formData.get('honeypot') ?? '')
    }

    fields.forEach(name => setFieldError(name))
    setStatus('', 'idle')

    const errors = validateRegistration(payload)
    const hasErrors = Object.keys(errors).length > 0

    if (hasErrors) {
      fields.forEach(name => setFieldError(name, errors[name]))
      setStatus('Please fix the highlighted fields and submit again.', 'error')
      return
    }

    const submitButton = registerForm.querySelector<HTMLButtonElement>('button[type="submit"]')
    if (!submitButton) {
      return
    }

    isSubmitting = true
    submitButton.disabled = true
    setStatus('Submitting registration...', 'idle')

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Registration failed. Please try again.')
      }

      registerForm.reset()
      setStatus('Registration submitted successfully. Please check your email.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error. Please try again.'
      setStatus(message, 'error')
    } finally {
      isSubmitting = false
      submitButton.disabled = false
    }
  })
}

function renderApp() {
  const currentRoute = getRoute()
  const hasGraph = currentRoute === '/'
  const page =
    currentRoute === '/schedule'
      ? renderSchedulePage()
      : currentRoute === '/about'
        ? renderAboutPage()
        : currentRoute === '/register'
          ? renderRegisterPage()
          : renderHomePage()

  cleanupCanvas?.()
  cleanupCanvas = null

  app.innerHTML = `
    ${hasGraph ? '<div class="page-bg" aria-hidden="true"><canvas id="hero-viz" width="800" height="600"></canvas></div>' : ''}
    <div class="page-shell${hasGraph ? ' has-graph' : ''}">
      <header class="site-header">
        <a class="brand" href="#/" aria-label="EXIT contest page">
          <img class="brand-mark" src="${eccLogoUrl}" alt="Exeter Computing Club logo" />
          <span class="brand-copy">
            <strong>${escapeHtml(eventSummary.name)}</strong>
            <span>${escapeHtml(eventSummary.venue)} · ${escapeHtml(eventSummary.city)}</span>
          </span>
        </a>
        <nav class="site-nav" aria-label="Primary">
          ${navLink('/', 'Contest', currentRoute)}
          ${navLink('/schedule', 'Schedule', currentRoute)}
          ${navLink('/about', 'About Us', currentRoute)}
          ${navLink('/register', 'Register', currentRoute)}
        </nav>
      </header>

      <main class="page-content">
        ${page}
      </main>
    </div>
  `

  if (hasGraph) {
    const viz = document.querySelector<HTMLCanvasElement>('#hero-viz')
    if (viz) {
      cleanupCanvas = mountNetworkCanvas(viz)
    }
  }

  if (currentRoute === '/register') {
    setupRegisterForm()
  }
}

renderApp()
window.addEventListener('hashchange', renderApp)
