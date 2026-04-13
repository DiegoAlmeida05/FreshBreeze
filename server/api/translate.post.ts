import { createError, defineEventHandler, readBody } from 'h3'

interface TranslateRequestBody {
  text?: unknown
}

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

export default defineEventHandler(async (event) => {
  const body = await readBody<TranslateRequestBody>(event)
  const sourceText = normalizeText(body?.text)

  if (!sourceText) {
    throw createError({
      statusCode: 400,
      statusMessage: 'The "text" field is required.',
    })
  }

  const config = useRuntimeConfig(event)
  const openaiApiKey = String(config.openaiApiKey || '').trim()

  if (!openaiApiKey) {
    // Fallback mode when API key is not configured.
    return {
      translatedText: sourceText,
    }
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You translate short property maintenance notes from Portuguese to natural, simple English. Keep meaning exact. Do not add extra details. Return only the translated text.',
        },
        {
          role: 'user',
          content: sourceText,
        },
      ],
    }),
  })

  const data = await response.json() as OpenAIChatCompletionResponse

  if (!response.ok) {
    const fallbackMessage = response.statusText || 'Translation request failed.'
    throw createError({
      statusCode: response.status,
      statusMessage: fallbackMessage,
    })
  }

  const translatedText = normalizeText(data?.choices?.[0]?.message?.content)

  if (!translatedText) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Translation service returned an empty response.',
    })
  }

  return {
    translatedText,
  }
})
