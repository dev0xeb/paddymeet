import QRCode from 'qrcode'

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
