import { createError, defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  throw createError({
    statusCode: 410,
    statusMessage: 'Deprecated endpoint. Worker invoice emails must be sent manually via the user email app (mailto/Web Share flow).',
  })
})
