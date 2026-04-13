import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = 'Pallaki <notifications@pallaki.com>'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  try {
    const { type, recipientEmail, recipientName, actorName, inquiryMessage } = await req.json()

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: 'Missing recipientEmail' }), { status: 400 })
    }

    let subject = ''
    let html = ''

    if (type === 'new_inquiry') {
      subject = `💌 New inquiry from ${actorName || 'a family'} — Pallaki`
      html = `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #3D1D2A;">
          <div style="background: linear-gradient(135deg, #6B3A46, #3D1D2A); padding: 28px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; font-size: 1.4rem; font-weight: 400; margin: 0;">पल्लकी</h1>
          </div>
          <div style="background: #FFF6F8; padding: 28px 32px; border: 1px solid #F5D0D6; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="font-size: 1.2rem; font-weight: 500; color: #6B3A46; margin-top: 0;">You have a new inquiry!</h2>
            <p style="color: #5A3A3A; line-height: 1.7; font-size: .95rem;">
              <strong>${actorName || 'A family'}</strong> has sent you an inquiry on Pallaki.
            </p>
            ${inquiryMessage ? `
            <div style="background: #fff; border: 1px solid #F5D0D6; border-radius: 8px; padding: 14px 16px; margin: 16px 0; font-style: italic; color: #5A3A3A; line-height: 1.65; font-size: .92rem;">
              "${inquiryMessage}"
            </div>` : ''}
            <a href="https://pallaki.com/staging/analytics" style="display: inline-block; background: #C4848C; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: .9rem; margin-top: 8px;">
              View Inquiry →
            </a>
            <p style="color: #9B7B80; font-size: .78rem; margin-top: 24px; line-height: 1.6;">
              You're receiving this because you have a vendor listing on Pallaki.
            </p>
          </div>
        </div>`
    } else if (type === 'inquiry_reply') {
      subject = `💬 ${actorName || 'A vendor'} replied to your inquiry — Pallaki`
      html = `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #3D1D2A;">
          <div style="background: linear-gradient(135deg, #6B3A46, #3D1D2A); padding: 28px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; font-size: 1.4rem; font-weight: 400; margin: 0;">पल्लकी</h1>
          </div>
          <div style="background: #FFF6F8; padding: 28px 32px; border: 1px solid #F5D0D6; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="font-size: 1.2rem; font-weight: 500; color: #6B3A46; margin-top: 0;">A vendor replied to your inquiry</h2>
            <p style="color: #5A3A3A; line-height: 1.7; font-size: .95rem;">
              <strong>${actorName || 'A vendor'}</strong> has replied to your inquiry on Pallaki.
            </p>
            ${inquiryMessage ? `
            <div style="background: #fff; border: 1px solid #F5D0D6; border-radius: 8px; padding: 14px 16px; margin: 16px 0; color: #5A3A3A; line-height: 1.65; font-size: .92rem;">
              ${inquiryMessage}
            </div>` : ''}
            <a href="https://pallaki.com/staging/profile" style="display: inline-block; background: #C4848C; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: .9rem; margin-top: 8px;">
              View Reply →
            </a>
            <p style="color: #9B7B80; font-size: .78rem; margin-top: 24px; line-height: 1.6;">
              You're receiving this because you sent an inquiry through Pallaki.
            </p>
          </div>
        </div>`
    } else {
      return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: recipientEmail, subject, html }),
    })

    const data = await res.json()
    if (!res.ok) return new Response(JSON.stringify({ error: data }), { status: res.status })

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
