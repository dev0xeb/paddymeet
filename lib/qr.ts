import QRCode from 'qrcode'

/**
 * Builds the link embedded in a ticket's QR code. Points at the public
 * gate-scanner page with the code pre-filled — scanning with any phone's
 * native camera app (no in-browser QR decoding needed, so it works on
 * Safari/iOS too) opens this link, which only pre-fills the code. It never
 * auto-submits: opening a link isn't the same as a human choosing to check
 * someone in, since some mail/chat clients pre-fetch links automatically
 * before anyone taps them. A passkey (or organiser login) is still required
 * before the code can actually be used to check a ticket in.
 */
export function buildTicketScanUrl(ticketCode: string): string {
  return `https://paddymeet.com/scan?code=${encodeURIComponent(ticketCode)}`
}

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}

/**
 * Generate a Base64 Data URL (PNG) of a QR code.
 * Ideal for rendering inside <img src={dataUrl} /> or PDF documents.
 */
export async function generateQRCodeDataURL(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    width = 300,
    margin = 2,
    color = {
      dark: '#000000',
      light: '#ffffff',
    },
  } = options

  return await QRCode.toDataURL(text, {
    width,
    margin,
    color,
    errorCorrectionLevel: 'M',
  })
}

/**
 * Generate an SVG string of a QR code.
 * Ideal for scalable, crisp vector graphics.
 */
export async function generateQRCodeSVG(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    width = 300,
    margin = 2,
    color = {
      dark: '#000000',
      light: '#ffffff',
    },
  } = options

  return await QRCode.toString(text, {
    type: 'svg',
    width,
    margin,
    color,
    errorCorrectionLevel: 'M',
  })
}

/**
 * Generate a QR Code Buffer for server-side saving or file upload.
 */
export async function generateQRCodeBuffer(
  text: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const {
    width = 300,
    margin = 2,
    color = {
      dark: '#000000',
      light: '#ffffff',
    },
  } = options

  return await QRCode.toBuffer(text, {
    width,
    margin,
    color,
    errorCorrectionLevel: 'M',
  })
}
