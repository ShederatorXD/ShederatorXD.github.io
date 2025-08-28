import { getCodebaseContextString } from '@/lib/codebase-context'

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

    const projectContext = getCodebaseContextString()

    const extraContext = (process.env.PROJECT_CONTEXT_EXTRA || '').trim()

    const systemPreamble = `You are EcoBot, a comprehensive AI assistant for the EcoRide sustainable transportation platform.

Your capabilities:
1. Answer questions about the EcoRide application, its features, and how to use them
2. Provide technical guidance about the codebase, architecture, and implementation
3. Help with development questions, debugging, and best practices
4. Assist with user support, troubleshooting, and feature explanations
5. Answer general questions across various topics (science, technology, sustainability, etc.)

When answering questions about the EcoRide project:
- Reference specific files, components, or API endpoints when relevant
- Explain how features work and where to find them in the UI
- Provide code examples when helpful for development questions
- Suggest best practices based on the project's architecture
- Be specific about the technology stack and implementation details

When answering general questions:
- Be clear, accurate, and concise
- Cite assumptions when making them
- Use steps or bullet points when helpful
- Include examples only when they aid clarity

Comprehensive project context:
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
  
  // App-specific questions
  if (lower.includes('ride') || lower.includes('book')) {
    return 'To book a ride: Go to Dashboard > Book Ride. Choose vehicle (EV shuttle, e-bike, ride-sharing), set pickup and drop-off locations, then confirm. You can also schedule rides in advance. The system calculates CO₂ savings and awards EcoPoints for sustainable choices.'
  }
  if (lower.includes('point') || lower.includes('ecopoint') || lower.includes('reward')) {
    return 'EcoPoints are earned from sustainable transportation choices. Check your balance in Dashboard > EcoPoints. Points can be redeemed for rewards in the Wallet section. You also earn badges for achievements and milestones.'
  }
  if (lower.includes('impact') || lower.includes('co2') || lower.includes('carbon')) {
    return 'Your environmental impact is tracked in Dashboard > Impact. The system calculates CO₂ savings for each ride and shows your cumulative impact over time. View charts and statistics to see your contribution to sustainability.'
  }
  if (lower.includes('help') || lower.includes('support') || lower.includes('contact')) {
    return 'For help, open Dashboard > Support. Browse the FAQ section or create a support ticket. Use the EcoBot chat for instant assistance. Admins can manage tickets in the Admin dashboard.'
  }
  if (lower.includes('wallet') || lower.includes('payment') || lower.includes('card')) {
    return 'Manage payments in Dashboard > Wallet. Add payment methods, view transaction history, and redeem EcoPoints for rewards. The wallet integrates with the reward system for seamless point redemption.'
  }
  if (lower.includes('community') || lower.includes('post') || lower.includes('social')) {
    return 'Connect with other users in Dashboard > Community. Share posts, comment on others\' content, and participate in community challenges. Earn badges and recognition for your contributions.'
  }
  if (lower.includes('profile') || lower.includes('account') || lower.includes('settings')) {
    return 'Manage your account in Dashboard > Profile. Update personal information, avatar, preferences, and view your achievements. You can also see your ride history and impact statistics here.'
  }
  if (lower.includes('admin') || lower.includes('management')) {
    return 'Admin features are available in Dashboard > Admin (admin users only). Manage users, support tickets, system analytics, and perform maintenance tasks. Use the purge function carefully as it permanently deletes data.'
  }
  
  // Technical questions
  if (lower.includes('code') || lower.includes('develop') || lower.includes('tech')) {
    return 'EcoRide is built with Next.js 15, React 18, TypeScript, Tailwind CSS, and Supabase. The codebase includes comprehensive API endpoints, database schema with RLS policies, and modern UI components. Check the project structure in /app, /components, and /lib directories.'
  }
  if (lower.includes('database') || lower.includes('schema') || lower.includes('table')) {
    return 'The database uses PostgreSQL via Supabase with tables for profiles, rides, support_tickets, community_posts, impact_logs, rewards, and more. RLS policies ensure data security, and auto-cleanup functions maintain performance.'
  }
  if (lower.includes('api') || lower.includes('endpoint')) {
    return 'API endpoints are organized in /app/api with routes for authentication, support tickets, ride management, community features, and admin functions. All endpoints use proper authentication and error handling.'
  }
  
  // General questions
  if (lower.includes('sustainable') || lower.includes('eco') || lower.includes('green')) {
    return 'EcoRide promotes sustainable transportation by encouraging EV shuttles, e-bikes, ride-sharing, and walking. The app tracks CO₂ savings and rewards users with EcoPoints for making green choices. Every sustainable ride contributes to environmental impact reduction.'
  }
  
  return 'Hi! I\'m EcoBot, your AI assistant for EcoRide. I can help with app features, technical questions, development guidance, and general topics. Ask me about booking rides, EcoPoints, impact tracking, support, or any aspect of the EcoRide platform!'
}


