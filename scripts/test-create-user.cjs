require('dotenv').config()

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_API_URL = 'http://localhost:3000/api/admin/create-user'

const NEW_USER_PAYLOAD = {
  email: 'test.auto.user@empresa.com',
  password: '12345678',
  full_name: 'Teste Automatizado',
  phone: '0400000000',
  address: 'Teste Street 123',
  abn: '123456789',
  hourly_rate_weekday: 30,
  hourly_rate_sunday: 40,
  hourly_rate_holiday: 50,
  role: 'worker',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function requireEnv(key) {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

function isLocalhostUrl(url) {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

async function parseJsonResponse(response) {
  const raw = await response.text()
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return raw
  }
}

// ── Step 1: Login with Supabase Auth REST API ─────────────────────────────────

async function getAdminToken(supabaseUrl, anonKey, email, password) {
  console.log('[AUTH] Logging in...')

  const authUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`

  let response
  try {
    response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
      },
      body: JSON.stringify({ email, password }),
    })
  } catch (error) {
    throw new Error(`Auth network error: ${error.message}`)
  }

  const body = await parseJsonResponse(response)

  if (!response.ok) {
    const reason = (body && (body.error_description || body.message)) || response.status
    throw new Error(`Auth failed: ${reason}`)
  }

  if (!body || !body.access_token) {
    throw new Error('Auth succeeded but no access_token returned.')
  }

  console.log('[AUTH] Login successful.')
  console.log('[AUTH] Token received.')

  return body.access_token
}

// ── Step 2: Call protected admin API ──────────────────────────────────────────

async function createUser(apiUrl, accessToken) {
  console.log('[TEST] Sending request...')

  let response
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken,
      },
      body: JSON.stringify(NEW_USER_PAYLOAD),
    })
  } catch (error) {
    throw new Error(`API network error: ${error.message}`)
  }

  const body = await parseJsonResponse(response)

  console.log(`[TEST] Status: ${response.status}`)
  console.log(`[TEST] Response: ${JSON.stringify(body)}`)

  if (!response.ok) {
    throw new Error(`API error: status=${response.status}`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function runTest() {
  const supabaseUrl = requireEnv('NUXT_PUBLIC_SUPABASE_URL')
  const anonKey     = requireEnv('NUXT_PUBLIC_SUPABASE_KEY')
  const adminEmail  = requireEnv('TEST_ADMIN_EMAIL')
  const adminPass   = requireEnv('TEST_ADMIN_PASSWORD')
  const apiUrl      = process.env.CREATE_USER_TEST_URL || DEFAULT_API_URL

  if (!isLocalhostUrl(apiUrl)) {
    throw new Error('Unsafe target URL. Use localhost/127.0.0.1 only.')
  }

  const accessToken = await getAdminToken(supabaseUrl, anonKey, adminEmail, adminPass)
  await createUser(apiUrl, accessToken)
}

runTest().catch(function (error) {
  console.error(`[TEST] Error: ${error.message}`)
  process.exitCode = 1
})
