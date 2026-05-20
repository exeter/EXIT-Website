import { Clerk } from '@clerk/clerk-js';
import exitLogoUrl from '../exit-logo.png'
import './style.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

type Route = '/' | '/info' | '/schedule' | '/about' | '/register'

type RegistrationPayload = {
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  school: string
  cityStateCountry: string
  grade: string
  backgroundLevel: string
  honeypot: string
}

type RegisterFieldName = keyof Omit<RegistrationPayload, 'honeypot' | 'email'>

async function instantiateClerk() {
  if (!publishableKey) {
    throw new Error("Add your VITE_CLERK_PUBLISHABLE_KEY to the .env file");
  }

  const clerkInstance = new Clerk(publishableKey);
  await clerkInstance.load();

  return clerkInstance;
}

const eventSummary = {
  name: 'Exeter Informatics Tournament',
  shortName: 'EXIT',
  date: 'Mid-October weekend, 2026',
  venue: 'Online and in person',
  location: 'Phillips Exeter Academy',
  club: 'Exeter Computing Club'
} as const

const contestContactEmail = 'exeterecc@gmail.com'

/** Update hrefs to your real community channels. Icons load from simpleicons.org CDN. */
const socialLinks: readonly { brand: string; label: string; href: string }[] = [
  { brand: 'discord', label: 'Discord', href: 'https://discord.gg/' },
  { brand: 'github', label: 'GitHub', href: 'https://github.com/ECC-Project-Group' },
  { brand: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/peacomputingclub/' },
  { brand: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/' }
] as const

const socialIconColor = '454039'

function renderSocialLinksHtml(): string {
  return socialLinks
    .map(
      item => `
        <li>
          <a
            class="footer-social-link"
            href="${escapeHtml(item.href)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHtml(item.label)}"
          >
            <img
              class="footer-social-img"
              src="https://cdn.simpleicons.org/${escapeHtml(item.brand)}/${socialIconColor}"
              alt=""
              width="22"
              height="22"
              loading="lazy"
            />
          </a>
        </li>`
    )
    .join('')
}

type HomeSection = {
  label: string
  body: string
}

const homeSections: readonly HomeSection[] = [
  {
    label: 'Time and location',
    body:
      'EXIT 2026 takes place on a mid-October weekend; exact dates and session times will be posted before the event. You may compete in person at Phillips Exeter Academy or take part through the online component from anywhere.'
  },
  {
    label: 'Details',
    body:
      'The Exeter Informatics Tournament (EXIT) is an annual competitive programming contest organized by the Exeter Computing Club. Elementary, middle, and high school students may compete, and the tournament is open to participants worldwide. Problems follow a USACO-style format—algorithmic challenges that generally grow harder within each round. The contest includes an individual round, offered both online and in person, and a team round held in person only. Competitors register in a beginner or advanced division, each with its own awards (details to be announced). Final round lengths, problem counts, scoring, and platform information will be published before contest day.'
  },
  {
    label: 'Rules',
    body:
      'EXIT follows standard competitive programming conduct, similar in spirit to major online judges, adapted for our hybrid format. Unless the final rules packet says otherwise, do not use AI assistants, code generators, or outside help. Work alone during the individual round; during the team round, collaborate only with your registered teammates. Do not share live problem statements, solutions, or other sensitive contest material in public channels while the contest is running. Violations may lead to disqualification, and organizer rulings are final. Online participants should bring a reliable computer and internet connection; in-person participants should follow instructions from staff on site. Tie-breaking procedures and the full scoring rules will be published with the final rules packet.'
  }
] as const

const tournamentDirectors = [
  'Aaryan Patel',
  'Gavin Zhao',
  'Aaditya Bilakanti',
  'Chris Spencer',
  'Ura Shi'
] as const

const gradeOptions = ['4', '5', '6', '7', '8', '9', '10', '11', '12', 'Postgraduate', 'Other'] as const
const backgroundLevelOptions = ['Beginner', 'Intermediate', 'Advanced', 'Competitive'] as const

const appRoot = document.querySelector<HTMLDivElement>('#app')

if (!appRoot) {
  throw new Error('App root not found')
}

const app = appRoot
let clerk: Clerk | null = null
let clerkReady = false
let authActionInFlight = false
let lastSessionId: string | null = null

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

  if (hash === '/info' || hash === '/schedule' || hash === '/about' || hash === '/register') {
    return hash
  }

  return '/'
}

function getAuthRedirectUrl(): string {
  return `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`
}

/** Restore the saved route after sign-in redirect if the user is now signed in. */
function restoreSavedRoute(): void {
  const savedRoute = sessionStorage.getItem('exit_redirect_route')
  if (savedRoute && savedRoute !== '/' && clerk?.user) {
    window.location.hash = `#${savedRoute}`
    sessionStorage.removeItem('exit_redirect_route')
  }
}

function getSignedInEmail(): string | null {
  const primaryEmail = clerk?.user?.primaryEmailAddress?.emailAddress
  if (primaryEmail) {
    return primaryEmail
  }

  const fallbackEmail = clerk?.user?.emailAddresses?.[0]?.emailAddress
  return fallbackEmail ?? null
}

async function performAuthAction() {
  if (!clerk || authActionInFlight) {
    console.log('[auth] performAuthAction skipped', {
      hasClerk: Boolean(clerk),
      authActionInFlight
    })
    return
  }

  authActionInFlight = true
  console.log('[auth] performAuthAction start', {
    hasUser: Boolean(clerk.user),
    sessionId: clerk.session?.id ?? null,
    route: getRoute()
  })
  renderApp()
  let shouldReloadAfterAuth = false

  try {
    if (clerk.user) {
      console.log('[auth] signing out')
      await clerk.signOut()
      console.log('[auth] sign out complete', {
        sessionId: clerk.session?.id ?? null,
        hasUser: Boolean(clerk.user)
      })
            shouldReloadAfterAuth = true
    } else {











      // Save the intended route so we can restore it after the OAuth redirect
            sessionStorage.setItem('exit_redirect_route', getRoute())

            const redirectUrl = getAuthRedirectUrl()

            console.log('[auth] redirecting to Clerk hosted sign-in', {
              hasUser: Boolean(clerk.user),
              redirectUrl
            })

            authActionInFlight = false
            renderApp()

            clerk.redirectToSignIn({ redirectUrl })
      return
    }
  } catch (error) {
    console.error('Auth action failed', error)
  }

  authActionInFlight = false

  if (shouldReloadAfterAuth) {
    console.log('[auth] reloading page now')
    window.location.reload()
    return
  }

  console.log('[auth] rerendering without reload', {
    sessionId: clerk.session?.id ?? null,
    hasUser: Boolean(clerk.user)
  })
  renderApp()

}

function navLink(route: Route, label: string, currentRoute: Route): string {
  const isActive = route === currentRoute ? ' is-active' : ''
  return `<a class="nav-link${isActive}" href="#${route}">${label}</a>`
}

function renderSiteFooter(): string {
  const year = new Date().getFullYear()
  return `
    <footer class="site-footer" role="contentinfo">
      <div class="site-footer-inner">
        <div class="site-footer-grid">
          <section class="site-footer-col" aria-labelledby="footer-contact-heading">
            <h2 id="footer-contact-heading" class="site-footer-heading">Contact</h2>
            <p class="site-footer-email-row">
              <span class="site-footer-email-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.708 2.825L15 11.105V5.383zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741zM1 11.105l4.708-2.897L1 5.383v5.722z"/>
                </svg>
              </span>
              <a class="site-footer-email" href="mailto:${escapeHtml(contestContactEmail)}">${escapeHtml(contestContactEmail)}</a>
            </p>
            <ul class="site-footer-social">
              ${renderSocialLinksHtml()}
            </ul>
          </section>
          <section class="site-footer-col site-footer-col-aside" aria-label="About EXIT">
            <p class="site-footer-aside-title">${escapeHtml(eventSummary.name)}</p>
            <p class="site-footer-aside-text">
              ${escapeHtml(eventSummary.club)} · ${escapeHtml(eventSummary.location)}
            </p>
          </section>
        </div>
        <p class="site-footer-attrib">
          © ${year} ${escapeHtml(eventSummary.club)} · Phillips Exeter Academy. Student-organized contest.
        </p>
      </div>
    </footer>
  `
}

function renderDirectors(): string {
  const cards = tournamentDirectors
    .map(
      name => `
        <div class="director-card">
          <span class="director-card-name">${escapeHtml(name)}</span>
          <span class="director-card-label">Tournament director</span>
        </div>`
    )
    .join('')
  return `<div class="director-grid">${cards}</div>`
}

function renderHomeSections(): string {
  return homeSections
    .map(
      section => `
        <section class="info-section">
          <h2 class="info-section-label">${escapeHtml(section.label)}</h2>
          <p class="info-section-body">${escapeHtml(section.body)}</p>
        </section>`
    )
    .join('')
}

function renderHomePage(): string {
  return `
    <div class="landing">
      <div class="landing-hero">
        <p class="landing-eyebrow">${escapeHtml(eventSummary.shortName)} 2026</p>
        <h1 class="landing-name">${escapeHtml(eventSummary.name)}</h1>
        <p class="landing-club">${escapeHtml(eventSummary.club)}</p>
        <div class="landing-meta-block" aria-label="Event date and format">
          <p class="landing-when">${escapeHtml(eventSummary.date)} · ${escapeHtml(eventSummary.venue)}</p>
          <p class="landing-where">${escapeHtml(eventSummary.location)}</p>
        </div>
        <p class="landing-hook">
          USACO-style competitive programming for students worldwide.
        </p>
        <p class="landing-lead">
          Beginner and advanced divisions. Individual round online or on campus; team round in person.
        </p>
      </div>
      <div class="landing-actions">
        <a class="link-button link-button-primary" href="#/register">Register</a>
        <a class="link-button link-button-quiet" href="#/info">Contest details</a>
      </div>
      <p class="landing-contact">
        Questions? See <a href="#/info">Contest details</a> or the footer.
      </p>
    </div>
  `
}

function renderInfoPage(): string {
  return `
    <header class="sheet-head">
      <h1 class="sheet-title">Contest details</h1>
      <p class="sheet-lede">
        General information for EXIT 2026. Final specifics will be posted before the event.
      </p>
    </header>
    <div class="info-article">
      ${renderHomeSections()}
    </div>
  `
}

function renderSchedulePage(): string {
  return `
    <header class="sheet-head">
      <h1 class="sheet-title">Schedule</h1>
      <p class="sheet-lede">
        Times and sessions will be posted closer to the event.
      </p>
    </header>
    <div class="sheet-block" aria-label="Schedule status">
      <p class="sheet-tbd">TBD</p>
      <p class="sheet-body">
        Check-in, rounds, breaks, and awards are not finalized yet. Watch this page for updates, or use the contact in
        the site footer.
      </p>
    </div>
  `
}

function renderAboutPage(): string {
  return `
    <div class="about-page">
      <header class="about-hero">
        <p class="about-hero-label">Phillips Exeter Academy</p>
        <h1 class="sheet-title about-hero-title">About EXIT</h1>
        <p class="about-hero-lede">
          EXIT is the Exeter Informatics Tournament—a competitive programming event run by the
          <strong>Exeter Computing Club</strong>. We care about clear rules, fair judging, and a contest day that feels
          organized and welcoming for every team.
        </p>
      </header>

      <section class="about-panel" aria-labelledby="about-club-heading">
        <h2 id="about-club-heading" class="about-panel-title">The club behind the contest</h2>
        <p class="about-panel-text">
          The Exeter Computing Club is PEA's hub for CS: machine learning reading groups, USACO-style practice,
          weekend builds, and hackathon crews. Whether you are new to code or already shipping projects, there is a seat
          at the table.
        </p>
        <p class="about-panel-text">
          Club members also ship tools for campus—see
          <a href="https://exetercoursemap.vercel.app/" target="_blank" rel="noopener noreferrer">Exeter Course Map</a>
          for 450+ courses, prerequisites, and planning paths through the curriculum.
        </p>
      </section>

      <section class="about-panel about-panel-directors" aria-labelledby="about-directors-heading">
        <div class="about-directors-head">
          <h2 id="about-directors-heading" class="about-panel-title">Tournament directors</h2>
          <p class="about-directors-sub">
            Organizing EXIT ${escapeHtml(eventSummary.date)}. For questions, see the
            <a href="#/info">Contest details</a> page or the site footer.
          </p>
        </div>
        ${renderDirectors()}
      </section>
    </div>
  `
}

function renderRegisterPage(): string {
  const isSignedIn = Boolean(clerk?.user)
  const signedInEmail = getSignedInEmail()

  if (!isSignedIn) {
    return `
      <header class="sheet-head">
        <h1 class="sheet-title">Register</h1>
        <p class="sheet-lede">Sign in first to continue.</p>
      </header>

      <section class="register-grid">
        <section class="sheet-panel register-panel" aria-label="Sign in required">
          <h2 class="sheet-panel-title">Student registration</h2>
          <p class="sheet-body">
            Your signed-in email is used for contest updates.
          </p>
          <div class="register-form-panel">
            <div class="actions">
              <button
                id="register-signin-button"
                class="button button-primary"
                type="button"
                ${!clerkReady || authActionInFlight ? 'disabled' : ''}
              >${clerkReady ? 'Sign in to continue' : 'Auth loading...'}</button>
            </div>
          </div>
        </section>
      </section>
    `
  }

  return `
    <header class="sheet-head">
      <h1 class="sheet-title">Register</h1>
      <p class="sheet-lede">One form per student. Use an email you check often.</p>
    </header>

    <section class="register-grid">
      <section class="sheet-panel register-panel">
        <h2 class="sheet-panel-title">Your details</h2>
        <p class="sheet-body">
          Signed in as <strong>${escapeHtml(signedInEmail ?? '')}</strong>.
        </p>
        <section class="register-form-panel" aria-label="Registration form">
          <form id="register-form" novalidate>
            <div class="form-stack">
              <div class="field-wrap">
                <input class="field" type="text" name="firstName" placeholder="First Name *" autocomplete="given-name" required />
                <p class="error-msg" data-error-for="firstName"></p>
              </div>

              <div class="field-wrap">
                <input class="field" type="text" name="lastName" placeholder="Last Name *" autocomplete="family-name" required />
                <p class="error-msg" data-error-for="lastName"></p>
              </div>

              <div class="field-wrap">
                <input class="field" type="tel" name="phoneNumber" placeholder="Phone Number *" autocomplete="tel" required />
                <p class="error-msg" data-error-for="phoneNumber"></p>
              </div>

              <div class="field-wrap">
                <input class="field" type="text" name="school" placeholder="School *" autocomplete="organization" required />
                <p class="error-msg" data-error-for="school"></p>
              </div>

              <div class="field-wrap">
                <input class="field" type="text" name="cityStateCountry" placeholder="City, State/Province, Country *" autocomplete="address-level2" required />
                <p class="error-msg" data-error-for="cityStateCountry"></p>
              </div>

              <div class="field-wrap">
                <select class="field" name="grade" required>
                  <option value="">Grade *</option>
                  ${gradeOptions.map(option => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}
                </select>
                <p class="error-msg" data-error-for="grade"></p>
              </div>

              <div class="field-wrap">
                <select class="field" name="backgroundLevel" required>
                  <option value="">Background Level *</option>
                  ${backgroundLevelOptions.map(option => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}
                </select>
                <p class="error-msg" data-error-for="backgroundLevel"></p>
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
    </section>
  `
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+\-()\s]/g, '').replace(/\s+/g, ' ').trim()
}

function validateRegistration(payload: RegistrationPayload): Partial<Record<RegisterFieldName, string>> {
  const errors: Partial<Record<RegisterFieldName, string>> = {}

  if (!payload.firstName.trim()) {
    errors.firstName = 'First name is required.'
  }

  if (!payload.lastName.trim()) {
    errors.lastName = 'Last name is required.'
  }

  if (!payload.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone number is required.'
  } else if (payload.phoneNumber.replace(/\D/g, '').length < 10) {
    errors.phoneNumber = 'Enter a valid phone number.'
  }

  if (!payload.school.trim()) {
    errors.school = 'School is required.'
  }

  if (!payload.cityStateCountry.trim()) {
    errors.cityStateCountry = 'City, state/province, and country are required.'
  }

  if (!payload.grade.trim()) {
    errors.grade = 'Grade is required.'
  }

  if (!payload.backgroundLevel.trim()) {
    errors.backgroundLevel = 'Background level is required.'
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
    'firstName',
    'lastName',
    'phoneNumber',
    'school',
    'cityStateCountry',
    'grade',
    'backgroundLevel'
  ]

  function setFieldError(name: RegisterFieldName, message?: string) {
    const input = registerForm.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null
    const msg = registerForm.querySelector<HTMLParagraphElement>(`[data-error-for="${name}"]`)

    if (!input || !msg) {
      return
    }

    input.setAttribute('aria-invalid', message ? 'true' : 'false')
    msg.textContent = message ?? ''
  }

  function setStatus(message: string, kind: 'idle' | 'success' | 'warning' | 'error') {
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
    const signedInEmail = getSignedInEmail()

    if (!signedInEmail) {
      setStatus('Please sign in before submitting registration.', 'error')
      return
    }

    const payload: RegistrationPayload = {
      email: signedInEmail,
      firstName: String(formData.get('firstName') ?? '').trim(),
      lastName: String(formData.get('lastName') ?? '').trim(),
      phoneNumber: normalizePhone(String(formData.get('phoneNumber') ?? '')),
      school: String(formData.get('school') ?? '').trim(),
      cityStateCountry: String(formData.get('cityStateCountry') ?? '').trim(),
      grade: String(formData.get('grade') ?? '').trim(),
      backgroundLevel: String(formData.get('backgroundLevel') ?? '').trim(),
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

      const body = (await response.json().catch(() => null)) as {
        error?: string
        emailSent?: boolean
        emailError?: string
      } | null

      if (!response.ok) {
        throw new Error(body?.error ?? 'Registration failed. Please try again.')
      }

      registerForm.reset()

      if (body?.emailSent === false) {
        const technicalDetail = body.emailError?.trim() ? ` Technical detail: ${body.emailError.trim()}` : ''
        setStatus(`Registration was saved, but confirmation email delivery failed.${technicalDetail}`, 'warning')
      } else {
        setStatus('Registration submitted successfully. Please check your email.', 'success')
      }
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
  const isSignedIn = Boolean(clerk?.user)
  const authButtonLabel = !clerkReady
    ? 'Auth...'
    : authActionInFlight
      ? 'Working...'
      : isSignedIn
        ? 'Sign out'
        : 'Sign in'
  const page =
    currentRoute === '/info'
      ? renderInfoPage()
      : currentRoute === '/schedule'
        ? renderSchedulePage()
        : currentRoute === '/about'
          ? renderAboutPage()
          : currentRoute === '/register'
            ? renderRegisterPage()
            : renderHomePage()

  app.innerHTML = `
    <div class="app-root">
    <div class="page-shell">
      <header class="site-header">
        <a class="brand" href="#/" aria-label="EXIT contest page">
          <img class="brand-mark" src="${exitLogoUrl}" alt="EXIT" width="1024" height="1024" />
          <span class="brand-copy">
            <strong>${escapeHtml(eventSummary.name)}</strong>
            <span>${escapeHtml(eventSummary.club)}</span>
          </span>
        </a>
        <nav class="site-nav" aria-label="Primary">
          ${navLink('/', 'Home', currentRoute)}
          ${navLink('/info', 'Details', currentRoute)}
          ${navLink('/schedule', 'Schedule', currentRoute)}
          ${navLink('/about', 'About', currentRoute)}
          ${navLink('/register', 'Register', currentRoute)}
          <button
            id="auth-button"
            class="button button-secondary nav-auth"
            type="button"
            ${!clerkReady || authActionInFlight ? 'disabled' : ''}
          >${authButtonLabel}</button>
        </nav>
      </header>

      <main class="page-content">
        <div class="main-inner">
          ${page}
        </div>
      </main>
    </div>
    ${renderSiteFooter()}
    </div>
  `

  if (currentRoute === '/register') {
    setupRegisterForm()

    const registerSignInButton = document.querySelector<HTMLButtonElement>('#register-signin-button')
    if (registerSignInButton) {
      registerSignInButton.addEventListener('click', () => {
        void performAuthAction()
      })
    }
  }

  const authButton = document.querySelector<HTMLButtonElement>('#auth-button')
  if (authButton) {
    authButton.addEventListener('click', () => {
      void performAuthAction()
    })
  }
}

renderApp()

instantiateClerk()
  .then(clerkInstance => {
    clerk = clerkInstance
    clerkReady = true
    lastSessionId = clerk.session?.id ?? null
    console.log('[auth] clerk initialized', {
          sessionId: lastSessionId,
          hasUser: Boolean(clerk.user)
        })

        // Restore saved route if the user just completed sign-in
        restoreSavedRoute()

        clerk.addListener(() => {
          const nextSessionId = clerk?.session?.id ?? null
          const hasSignedInUser = Boolean(clerk?.user)

          console.log('[auth] clerk listener fired', {
            lastSessionId,
            nextSessionId,
            hasSignedInUser,
            authActionInFlight
          })

          if (nextSessionId !== lastSessionId) {
            lastSessionId = nextSessionId
            console.log('[auth] tracked new session id', {
              lastSessionId
            })
          }

          if (authActionInFlight && !hasSignedInUser) {
            console.log('[auth] listener waiting for auth action to complete')
            return
          }

          console.log('[auth] listener rendering app', {
            nextSessionId,
            hasSignedInUser
          })
          renderApp()

          // After rendering, restore saved route if user just signed in
          restoreSavedRoute()
        })
    console.log('[auth] initial clerk render')
    renderApp()
  })
  .catch(error => {
    console.error('Failed to initialize Clerk', error)
  })

window.addEventListener('hashchange', renderApp)
