import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import OpenAI from 'openai'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string()
      })
    )
    .min(1),
  model: z.string().default('gpt-4o-mini')
})

app.post('/api/ok-e', async (req, res) => {
  const parse = ChatRequestSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid request', details: parse.error.flatten() })
  }
  const { messages, model } = parse.data

  try {
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7
    })

    return res.json({
      id: response.id,
      message: response.choices?.[0]?.message ?? null,
      usage: response.usage ?? null
    })
  } catch (err: unknown) {
    const error = err as Error & { status?: number; code?: string }
    return res
      .status((error as any).status ?? 500)
      .json({ error: error.message ?? 'Server error', code: (error as any).code })
  }
})

const PORT = Number(process.env.PORT || 8787)
app.listen(PORT, () => {
  console.log(`[ok-e] server running on http://localhost:${PORT}`)
})


