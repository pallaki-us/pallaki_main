import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'Pallaki <noreply@pallaki.us>'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { type, recipientEmail, recipientName, actorName, inquiryMessage, messageBody, link } = await req.json()
    const safeActorName = actorName ? escapeHtml(String(actorName)) : null
    const safeRecipientName = recipientName ? escapeHtml(String(recipientName)) : null
    const safeMessageBody = messageBody ? escapeHtml(String(messageBody)) : null
    const safeInquiryMessage = inquiryMessage ? escapeHtml(String(inquiryMessage)) : null

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: 'Missing recipientEmail' }), { status: 400 })
    }

    let subject = ''
    let html = ''

    if (type === 'new_message') {
      subject = `💬 New message from ${safeActorName || 'someone'} — Pallaki`
      html = `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #3D1D2A;">
          <div style="background: linear-gradient(135deg, #6B3A46, #3D1D2A); padding: 28px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; font-size: 1.4rem; font-weight: 400; margin: 0;">पल्लकी</h1>
          </div>
          <div style="background: #FFF6F8; padding: 28px 32px; border: 1px solid #F5D0D6; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="font-size: 1.2rem; font-weight: 500; color: #6B3A46; margin-top: 0;">You have a new message</h2>
            <p style="color: #5A3A3A; line-height: 1.7; font-size: .95rem;">
              <strong>${safeActorName || 'Someone'}</strong> sent you a message on Pallaki.
            </p>
            ${safeMessageBody ? `
            <div style="background: #fff; border: 1px solid #F5D0D6; border-radius: 8px; padding: 14px 16px; margin: 16px 0; font-style: italic; color: #5A3A3A; line-height: 1.65; font-size: .92rem;">
              "${safeMessageBody}"
            </div>` : ''}
            <a href="${link || 'https://pallaki.us'}" style="display: inline-block; background: #C4848C; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: .9rem; margin-top: 8px;">
              Reply on Pallaki →
            </a>
            <p style="color: #9B7B80; font-size: .78rem; margin-top: 24px; line-height: 1.6;">
              You're receiving this because you have an active conversation on Pallaki.
            </p>
          </div>
        </div>`
    } else if (type === 'new_inquiry') {
      subject = `💌 New inquiry from ${safeActorName || 'a family'} — Pallaki`
      html = `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #3D1D2A;">
          <div style="background: linear-gradient(135deg, #6B3A46, #3D1D2A); padding: 28px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; font-size: 1.4rem; font-weight: 400; margin: 0;">पल्लकी</h1>
          </div>
          <div style="background: #FFF6F8; padding: 28px 32px; border: 1px solid #F5D0D6; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="font-size: 1.2rem; font-weight: 500; color: #6B3A46; margin-top: 0;">You have a new inquiry!</h2>
            <p style="color: #5A3A3A; line-height: 1.7; font-size: .95rem;">
              <strong>${safeActorName || 'A family'}</strong> has sent you an inquiry on Pallaki.
            </p>
            ${safeInquiryMessage ? `
            <div style="background: #fff; border: 1px solid #F5D0D6; border-radius: 8px; padding: 14px 16px; margin: 16px 0; font-style: italic; color: #5A3A3A; line-height: 1.65; font-size: .92rem;">
              "${safeInquiryMessage}"
            </div>` : ''}
            <a href="https://pallaki.us/analytics" style="display: inline-block; background: #C4848C; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: .9rem; margin-top: 8px;">
              View Inquiry →
            </a>
            <p style="color: #9B7B80; font-size: .78rem; margin-top: 24px; line-height: 1.6;">
              You're receiving this because you have a vendor listing on Pallaki.
            </p>
          </div>
        </div>`
    } else if (type === 'inquiry_reply') {
      subject = `💬 ${safeActorName || 'A vendor'} replied to your inquiry — Pallaki`
      html = `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #3D1D2A;">
          <div style="background: linear-gradient(135deg, #6B3A46, #3D1D2A); padding: 28px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; font-size: 1.4rem; font-weight: 400; margin: 0;">पल्लकी</h1>
          </div>
          <div style="background: #FFF6F8; padding: 28px 32px; border: 1px solid #F5D0D6; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="font-size: 1.2rem; font-weight: 500; color: #6B3A46; margin-top: 0;">A vendor replied to your inquiry</h2>
            <p style="color: #5A3A3A; line-height: 1.7; font-size: .95rem;">
              <strong>${safeActorName || 'A vendor'}</strong> has replied to your inquiry on Pallaki.
            </p>
            ${safeInquiryMessage ? `
            <div style="background: #fff; border: 1px solid #F5D0D6; border-radius: 8px; padding: 14px 16px; margin: 16px 0; color: #5A3A3A; line-height: 1.65; font-size: .92rem;">
              ${safeInquiryMessage}
            </div>` : ''}
            <a href="https://pallaki.us/profile" style="display: inline-block; background: #C4848C; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: .9rem; margin-top: 8px;">
              View Reply →
            </a>
            <p style="color: #9B7B80; font-size: .78rem; margin-top: 24px; line-height: 1.6;">
              You're receiving this because you sent an inquiry through Pallaki.
            </p>
          </div>
        </div>`
    } else if (type === 'vendor_approved') {
      subject = `🎉 Your Pallaki listing is live! — Pallaki`
      html = `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #3D1D2A;">
          <div style="background: linear-gradient(135deg, #6B3A46, #3D1D2A); padding: 28px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; font-size: 1.4rem; font-weight: 400; margin: 0;">पल्लकी</h1>
          </div>
          <div style="background: #FFF6F8; padding: 28px 32px; border: 1px solid #F5D0D6; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="font-size: 1.2rem; font-weight: 500; color: #6B3A46; margin-top: 0;">Your listing is live! 🎉</h2>
            <p style="color: #5A3A3A; line-height: 1.7; font-size: .95rem;">
              Congratulations${safeRecipientName ? `, <strong>${safeRecipientName}</strong>` : ''}! Your Pallaki vendor profile has been reviewed and approved. Families planning their events can now discover and contact you.
            </p>
            <div style="background: #fff; border: 1px solid #F5D0D6; border-radius: 8px; padding: 14px 16px; margin: 16px 0; color: #5A3A3A; line-height: 1.65; font-size: .92rem;">
              <strong style="color: #6B3A46;">What's next?</strong><br/>
              Log in to your dashboard to complete your profile, add portfolio photos, and update your availability.
            </div>
            <a href="https://pallaki.us/dashboard" style="display: inline-block; background: #C4848C; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: .9rem; margin-top: 8px;">
              Go to My Dashboard →
            </a>
            <p style="color: #9B7B80; font-size: .78rem; margin-top: 24px; line-height: 1.6;">
              You're receiving this because you applied as a vendor on Pallaki.
            </p>
          </div>
        </div>`
    } else if (type === 'welcome_planner') {
      subject = `Welcome to Pallaki! — Start planning your event`
      html = `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #3D1D2A;">
          <div style="background: linear-gradient(135deg, #6B3A46, #3D1D2A); padding: 28px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; font-size: 1.4rem; font-weight: 400; margin: 0;">पल्लकी</h1>
          </div>
          <div style="background: #FFF6F8; padding: 28px 32px; border: 1px solid #F5D0D6; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="font-size: 1.2rem; font-weight: 500; color: #6B3A46; margin-top: 0;">Welcome${safeRecipientName ? `, ${safeRecipientName}` : ''}!</h2>
            <p style="color: #5A3A3A; line-height: 1.7; font-size: .95rem;">
              Your Pallaki account is ready. Browse our curated directory of South Asian wedding and event vendors — from mehndi artists to caterers to photographers.
            </p>
            <a href="https://pallaki.us" style="display: inline-block; background: #C4848C; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: .9rem; margin-top: 8px;">
              Browse Vendors →
            </a>
            <p style="color: #9B7B80; font-size: .78rem; margin-top: 24px; line-height: 1.6;">
              You're receiving this because you created an account on Pallaki.
            </p>
          </div>
        </div>`
    } else if (type === 'welcome_vendor') {
      subject = `Welcome to Pallaki! — Your application is under review`
      html = `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #3D1D2A;">
          <div style="background: linear-gradient(135deg, #6B3A46, #3D1D2A); padding: 28px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; font-size: 1.4rem; font-weight: 400; margin: 0;">पल्लकी</h1>
          </div>
          <div style="background: #FFF6F8; padding: 28px 32px; border: 1px solid #F5D0D6; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="font-size: 1.2rem; font-weight: 500; color: #6B3A46; margin-top: 0;">Welcome${safeRecipientName ? `, ${safeRecipientName}` : ''}!</h2>
            <p style="color: #5A3A3A; line-height: 1.7; font-size: .95rem;">
              Thanks for applying to list your business on Pallaki. Your application is now under review — we'll send you an email once it's approved.
            </p>
            <div style="background: #fff; border: 1px solid #F5D0D6; border-radius: 8px; padding: 14px 16px; margin: 16px 0; color: #5A3A3A; line-height: 1.65; font-size: .92rem;">
              <strong style="color: #6B3A46;">While you wait</strong><br/>
              Log in to complete your profile and add photos so you're ready to go live.
            </div>
            <a href="https://pallaki.us/vendor/login" style="display: inline-block; background: #C4848C; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: .9rem; margin-top: 8px;">
              Complete My Profile →
            </a>
            <p style="color: #9B7B80; font-size: .78rem; margin-top: 24px; line-height: 1.6;">
              You're receiving this because you applied as a vendor on Pallaki.
            </p>
          </div>
        </div>`
    } else {
      return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [recipientEmail],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ error: err }), { status: res.status })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
