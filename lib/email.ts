import { Resend } from 'resend'
import QRCode from 'qrcode'
import { buildTicketScanUrl } from '@/lib/qr'

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder_key')

const FROM_EMAIL = 'Paddymeet <tickets@paddymeet.com>'

// Admin-authored announcement text lands directly in this HTML, so it needs
// escaping — otherwise a title or message containing e.g. "<" breaks the
// layout in some mail clients.
function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface TicketInfo {
  ticketCode: string
  ticketTypeName: string
  attendeeName?: string
}

interface TicketEmailData {
  to: string
  recipientName: string
  eventTitle: string
  eventDate: string
  eventTime: string
  venueName: string
  tickets: TicketInfo[]
}

export async function sendTicketEmail(data: TicketEmailData) {
  const { to, recipientName, eventTitle, eventDate, eventTime, venueName, tickets } = data

  try {
    const ticketBlocks = await Promise.all(
      tickets.map(async (ticket) => {
        const qrDataUrl = await QRCode.toDataURL(buildTicketScanUrl(ticket.ticketCode), {
          width: 200,
          margin: 1,
          color: { dark: '#111827', light: '#ffffff' },
        })
        return `
          <div style="background: #f9fafb; border-radius: 16px; padding: 20px; margin-bottom: 16px; text-align: center;">
            <div style="font-size: 11px; font-weight: 700; color: #f97316; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${ticket.ticketTypeName}</div>
            ${ticket.attendeeName ? `<div style="font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 10px;">${ticket.attendeeName}</div>` : ''}
            <img src="${qrDataUrl}" width="160" height="160" alt="Ticket QR Code" style="display: block; margin: 0 auto 10px; border-radius: 8px;" />
            <div style="font-size: 14px; font-weight: 800; color: #111827; font-family: monospace; letter-spacing: 1px;">${ticket.ticketCode}</div>
          </div>
        `
      })
    )

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your ${tickets.length > 1 ? 'tickets' : 'ticket'} for ${eventTitle} ${tickets.length > 1 ? 'are' : 'is'} confirmed!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; padding: 32px 0;">
          <div style="background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #f0f0f0;">

            <div style="background: linear-gradient(135deg, #f97316, #ec4899); padding: 32px 24px; text-align: center;">
              <div style="font-size: 24px; font-weight: 900; color: white; letter-spacing: -0.5px;">
                <img src="https://paddymeet.com/brand/paddymeet-logo-kit/paddymeet-logo-horizontal-white-medium.png" alt="PaddyMeet" height="28" style="height: 28px; width: auto;" />
              </div>
            </div>

            <div style="padding: 32px 24px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 56px; height: 56px; background: #f0fdf4; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 12px;">🎉</div>
                <h1 style="font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 4px;">You're in, ${recipientName}!</h1>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">${tickets.length > 1 ? `${tickets.length} tickets confirmed` : 'Your ticket has been confirmed'}</p>
              </div>

              <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 16px; padding: 16px 20px; margin-bottom: 20px;">
                <div style="font-size: 16px; font-weight: 800; color: #111827; margin-bottom: 8px;">${eventTitle}</div>
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">📅 ${eventDate} ${eventTime ? `· ${eventTime}` : ''}</div>
                <div style="font-size: 13px; color: #6b7280;">📍 ${venueName}</div>
              </div>

              ${ticketBlocks.join('')}

              <a href="https://paddymeet.com/tickets" style="display: block; text-align: center; background: #f97316; color: white; font-weight: 700; font-size: 14px; padding: 14px; border-radius: 12px; text-decoration: none; margin-top: 8px;">
                View in Dashboard
              </a>

              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 16px 0 0;">
                Show your QR code at the entrance for quick check-in. See you there!
              </p>
            </div>
          </div>

          <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px;">
            Paddymeet Inc · 14 Bode Thomas Street, Surulere, Lagos
          </p>
        </div>
      `,
    })
    return { success: true, result }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

interface CheckInEmailData {
  to: string
  recipientName: string
  eventTitle: string
  ticketCode: string
  ticketTypeName: string
  checkedInAt: string
}

export async function sendCheckInEmail(data: CheckInEmailData) {
  const { to, recipientName, eventTitle, ticketCode, ticketTypeName, checkedInAt } = data

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You're checked in to ${eventTitle}!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; padding: 32px 0;">
          <div style="background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #f0f0f0;">

            <div style="background: linear-gradient(135deg, #16a34a, #22c55e); padding: 32px 24px; text-align: center;">
              <div style="font-size: 24px; font-weight: 900; color: white; letter-spacing: -0.5px;">
                <img src="https://paddymeet.com/brand/paddymeet-logo-kit/paddymeet-logo-horizontal-white-medium.png" alt="PaddyMeet" height="28" style="height: 28px; width: auto;" />
              </div>
            </div>

            <div style="padding: 32px 24px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 56px; height: 56px; background: #f0fdf4; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 12px;">✅</div>
                <h1 style="font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 4px;">You're checked in, ${recipientName}!</h1>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">Have a great time at ${eventTitle}</p>
              </div>

              <div style="background: #f9fafb; border: 1px solid #f0f0f0; border-radius: 16px; padding: 16px 20px; margin-bottom: 20px;">
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Ticket</div>
                <div style="font-size: 14px; font-weight: 800; color: #111827; font-family: monospace; letter-spacing: 1px; margin-bottom: 10px;">${ticketCode}</div>
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Tier</div>
                <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 10px;">${ticketTypeName}</div>
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Checked in at</div>
                <div style="font-size: 14px; font-weight: 700; color: #111827;">${new Date(checkedInAt).toLocaleString()}</div>
              </div>

              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                This ticket has now been used for entry and cannot be scanned again. If you didn't check in and think this is a mistake, contact the event organiser right away.
              </p>
            </div>
          </div>

          <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px;">
            Paddymeet Inc · 14 Bode Thomas Street, Surulere, Lagos
          </p>
        </div>
      `,
    })
    return { success: true, result }
  } catch (error) {
    console.error('Check-in email send error:', error)
    return { success: false, error }
  }
}

interface AnnouncementEmailRecipient {
  to: string
  recipientName?: string
}

// Sends one email per recipient via Resend's batch endpoint, 100 at a time
// (Resend's per-call limit) — not a single email with everyone in `to`,
// which would expose every recipient's address to every other recipient.
export async function sendAnnouncementEmails(recipients: AnnouncementEmailRecipient[], title: string, message: string) {
  const safeTitle = escapeHtml(title)
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />')

  const buildEmail = (r: AnnouncementEmailRecipient) => ({
    from: FROM_EMAIL,
    to: r.to,
    subject: title,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; padding: 32px 0;">
        <div style="background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #f0f0f0;">

          <div style="background: linear-gradient(135deg, #f97316, #ec4899); padding: 32px 24px; text-align: center;">
            <img src="https://paddymeet.com/brand/paddymeet-logo-kit/paddymeet-logo-horizontal-white-medium.png" alt="PaddyMeet" height="28" style="height: 28px; width: auto;" />
          </div>

          <div style="padding: 32px 24px;">
            <h1 style="font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 12px;">${safeTitle}</h1>
            ${r.recipientName ? `<p style="font-size: 13px; color: #9ca3af; margin: 0 0 16px;">Hi ${escapeHtml(r.recipientName)},</p>` : ''}
            <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 24px;">${safeMessage}</p>
            <a href="https://paddymeet.com" style="display: block; text-align: center; background: #f97316; color: white; font-weight: 700; font-size: 14px; padding: 14px; border-radius: 12px; text-decoration: none;">
              Open Paddymeet
            </a>
          </div>
        </div>

        <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px;">
          Paddymeet Inc · 14 Bode Thomas Street, Surulere, Lagos
        </p>
      </div>
    `,
  })

  let sent = 0
  let failed = 0

  for (let i = 0; i < recipients.length; i += 100) {
    const batch = recipients.slice(i, i + 100).map(buildEmail)
    try {
      const result = await resend.batch.send(batch)
      if (result.error) {
        failed += batch.length
        console.error('Announcement batch send error:', result.error)
      } else {
        sent += batch.length
      }
    } catch (error) {
      failed += batch.length
      console.error('Announcement batch send exception:', error)
    }
  }

  return { sent, failed }
}