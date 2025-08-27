export const runtime = 'edge'

type ChatMessage = { role: 'user' | 'model' | 'system'; content: string }

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    // We'll provide a graceful fallback if no API key is configured

    const body = await req.json().catch(() => ({}))
    const message: string = body?.message || ''
    const history: ChatMessage[] = Array.isArray(body?.history) ? body.history : []
    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message' }), { status: 400 })
    }

    // If there is no API key, respond with a smart local fallback
    if (!apiKey) {
      const text = generateLocalFallback(message)
      return new Response(
        JSON.stringify({ text, warning: 'Using local fallback. Set GEMINI_API_KEY to enable AI answers.' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    // Transform history into Gemini contents (filter unknown roles, cap history for token safety)
    const safeHistory = history
      .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'model'))
      .slice(-12)

    const projectContext = `Project: EcoRide — a sustainable ride-sharing dashboard app.
Key areas/pages: Dashboard, Book Ride, My Rides, EcoPoints, Impact, Wallet, Community, Support, Profile, Admin.
General guidance: Help users accomplish tasks within these pages. If needed, explain where in the UI to click.
Tech: Next.js App Router, Shadcn UI components, Supabase client in lib/supabase.ts.`

    const extraContext = (process.env.PROJECT_CONTEXT_EXTRA || '').trim()

    const systemPreamble = `You are EcoBot, a helpful, knowledgeable, and concise AI assistant.
You can answer general questions across a wide range of topics (science, code, math, history, travel, troubleshooting, etc.) and also help with app-specific questions.
Be clear, correct, and cite assumptions. If something is unknown or unsafe, say so briefly.
Prefer short, readable answers; use steps or bullets when helpful; include small examples only when they aid clarity.

App context to ground your answers:
${projectContext}${extraContext ? `\nAdditional context: ${extraContext}` : ''}`

    const contents = [
      { role: 'user', parts: [{ text: systemPreamble }] },
      ...safeHistory.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
      { role: 'user', parts: [{ text: message }] },
    ]

    // Allow model override via env; default prefers Pro then Flash
    const configuredModel = (process.env.GEMINI_MODEL || '').trim()
    const modelCandidates = configuredModel
      ? [configuredModel]
      : [
          'gemini-1.5-pro',
          'gemini-1.5-flash',
        ]

    let upstreamText: string | null = null
    let lastErrorText: string | null = null
    for (const model of modelCandidates) {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.5,
            topP: 0.9,
            maxOutputTokens: 2048,
          },
        }),
      })
      if (!resp.ok) {
        lastErrorText = await resp.text().catch(() => `HTTP ${resp.status}`)
        continue
      }
      const data = await resp.json().catch(() => ({} as any))
      upstreamText = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text)?.join('') || null
      if (upstreamText) break
    }

    if (!upstreamText) {
      // Fallback to local guidance on upstream failures
      const text = generateLocalFallback(message)
      return new Response(
        JSON.stringify({ text, error: 'Upstream error', details: lastErrorText || 'Unknown upstream error' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }
    const text = upstreamText || generateLocalFallback(message)
    return new Response(JSON.stringify({ text }), { status: 200, headers: { 'content-type': 'application/json' } })
  } catch (e: any) {
    const text = generateLocalFallback('')
    return new Response(
      JSON.stringify({ error: e?.message || 'Unknown error', text }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )
  }
}

function generateLocalFallback(message: string): string {
  const lower = (message || '').toLowerCase()
  if (lower.includes('ride') || lower.includes('book')) {
    return 'To book a ride: Go to Dashboard > Book Ride. Choose vehicle, set pickup and drop-off, then confirm. Need help scheduling? Open Dashboard > Book Ride and use the Schedule option.'
  }
  if (lower.includes('point') || lower.includes('ecopoint') || lower.includes('reward')) {
    return 'EcoPoints are earned from completed rides and challenges. Check balance in Dashboard > EcoPoints. Redeem from the Wallet page under Rewards.'
  }
  if (lower.includes('impact') || lower.includes('co2') || lower.includes('carbon')) {
    return 'Your CO₂ savings are shown in Dashboard > Impact. The impact chart updates after each eco-friendly ride.'
  }
  if (lower.includes('help') || lower.includes('support') || lower.includes('contact')) {
    return 'For help, open Dashboard > Support to browse FAQs or create a ticket. Urgent issues? Use Live Chat on the Support page.'
  }
  if (lower.includes('wallet') || lower.includes('payment') || lower.includes('card')) {
    return 'Manage payment methods in Dashboard > Wallet. You can add cards, view history, and redeem rewards there.'
  }
  return 'Hi! Ask me about booking rides, EcoPoints, your impact, wallet, or app help.'
}


