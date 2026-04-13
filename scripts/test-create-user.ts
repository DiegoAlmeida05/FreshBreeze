import process from 'node:process'

type CreateUserRequest = {
  email: string
  password: string
  full_name: string
  phone: string
  address: string
  abn: string
  hourly_rate_weekday: number
  hourly_rate_sunday: number
  hourly_rate_holiday: number
  role: 'worker'
}

const DEFAULT_URL = 'http://localhost:3000/api/admin/create-user'

const payload: CreateUserRequest = {
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

function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
  }
  catch {
    return false
  }
}

async function runTest(): Promise<void> {
  const targetUrl = process.env.CREATE_USER_TEST_URL ?? DEFAULT_URL

  if (!isLocalhostUrl(targetUrl)) {
    throw new Error('Unsafe target URL. Use localhost/127.0.0.1 only.')
  }

  const token = process.env.TEST_ADMIN_TOKEN
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  console.log('[TEST] Sending request...')

  let response: Response

  try {
    response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Network error: ${message}`)
  }

  const rawBody = await response.text()
  let responseBody: unknown = rawBody

  try {
    responseBody = rawBody ? JSON.parse(rawBody) : null
  }
  catch {
    // Keep raw text if response is not JSON.
  }

  console.log(`[TEST] Status: ${response.status}`)
  console.log(`[TEST] Response: ${JSON.stringify(responseBody)}`)

  if (!response.ok) {
    throw new Error(`API error: status=${response.status}`)
  }
}

runTest().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[TEST] Error: ${message}`)
  process.exitCode = 1
})
