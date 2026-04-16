import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk'

// Set ANTHROPIC_API_KEY as a Supabase Edge Function secret:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { vendor, messages, message } = await req.json()

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing message' }), { status: 400, headers: CORS })
    }

    const services = (vendor.services || []).join(', ')
    const areas = (vendor.service_areas || []).join(', ')
    const languages = (vendor.languages || []).join(', ')

    const systemPrompt = `You are a helpful AI assistant representing ${vendor.name}, a ${vendor.cat || 'wedding vendor'} based in ${vendor.loc || 'the US'} on Pallaki, a South Asian wedding marketplace.

About this vendor:
- Category: ${vendor.cat || 'Wedding vendor'}
- Location: ${vendor.loc || 'Not specified'}
- Description: ${vendor.desc || 'A quality wedding vendor on Pallaki.'}
${services ? `- Services offered: ${services}` : ''}
${vendor.events ? `- Events covered: ${vendor.events}` : ''}
${languages ? `- Languages spoken: ${languages}` : ''}
${areas ? `- Service areas: ${areas}` : ''}
${vendor.is_available !== undefined ? `- Currently available: ${vendor.is_available ? 'Yes' : 'No'}` : ''}
${vendor.availability_note ? `- Availability note: ${vendor.availability_note}` : ''}

Your role:
- Answer questions warmly and helpfully as if you are part of ${vendor.name}'s team
- Help families understand what to expect, what's included, the process, and logistics
- For specific pricing, say you'd be happy to share a custom quote — encourage them to send a formal inquiry for a detailed proposal
- If you genuinely don't know something specific, say "that's a great question — you'd want to confirm that directly with us via inquiry"
- Keep responses concise (2-4 sentences) and friendly
- Use a warm, professional tone appropriate for wedding planning`

    const allMessages = [
      ...(messages || []),
      { role: 'user', content: message },
    ]

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      system: systemPrompt,
      messages: allMessages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    return new Response(
      JSON.stringify({
        reply,
        messages: [...allMessages, { role: 'assistant', content: reply }],
      }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS })
  }
})
