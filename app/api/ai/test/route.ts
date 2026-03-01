// app/api/ai/test/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'API key not found',
        envKeys: Object.keys(process.env).filter(k => k.includes('ANTHROPIC'))
      })
    }

    // Import Anthropic dynamically
    const Anthropic = (await import('@anthropic-ai/sdk')).default

    const anthropic = new Anthropic({
      apiKey: apiKey,
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Reply with: API works!' }]
    })

    const text = message.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')

    return NextResponse.json({
      success: true,
      response: text,
      model: message.model
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      type: error.constructor.name,
      details: JSON.stringify(error, Object.getOwnPropertyNames(error))
    }, { status: 500 })
  }
}
