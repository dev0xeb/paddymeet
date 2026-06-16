import QRCode from 'qrcode'

export interface TicketImageData {
  eventTitle: string
  ticketTypeName: string
  eventDate: string
  venueName?: string
  ticketCode: string
  attendeeName?: string
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ')
  let line = ''
  const lines: string[] = []
  for (const word of words) {
    const testLine = line + word + ' '
    if (ctx.measureText(testLine).width > maxWidth && line !== '') {
      lines.push(line)
      line = word + ' '
    } else {
      line = testLine
    }
  }
  lines.push(line)
  lines.forEach((l, i) => ctx.fillText(l.trim(), x, y + i * lineHeight))
  return lines.length
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function generateTicketCanvas(data: TicketImageData): Promise<HTMLCanvasElement> {
  const { eventTitle, ticketTypeName, eventDate, venueName, ticketCode, attendeeName } = data

  const width = 500
  const height = attendeeName ? 770 : 730
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // Border
  ctx.strokeStyle = '#f3f4f6'
  ctx.lineWidth = 3
  roundRect(ctx, 4, 4, width - 8, height - 8, 24)
  ctx.stroke()

  // Header gradient
  const headerHeight = 90
  ctx.save()
  roundRect(ctx, 4, 4, width - 8, headerHeight, 22)
  ctx.clip()
  const gradient = ctx.createLinearGradient(0, 0, width, headerHeight)
  gradient.addColorStop(0, '#f97316')
  gradient.addColorStop(1, '#ec4899')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, headerHeight)
  ctx.restore()

  // Logo text
  ctx.font = 'bold 28px Arial, sans-serif'
  const logoText1 = 'paddy'
  const logoText2 = 'meet'
  const w1 = ctx.measureText(logoText1).width
  const w2 = ctx.measureText(logoText2).width
  const totalW = w1 + w2
  const startX = width / 2 - totalW / 2
  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(logoText1, startX, headerHeight / 2 + 10)
  ctx.fillStyle = '#1f2937'
  ctx.fillText(logoText2, startX + w1, headerHeight / 2 + 10)

  let y = headerHeight + 45

  ctx.textAlign = 'center'
  ctx.fillStyle = '#111827'
  ctx.font = 'bold 22px Arial, sans-serif'
  const titleLines = wrapText(ctx, eventTitle, width / 2, y, width - 60, 28)
  y += titleLines * 28 + 10

  ctx.font = '14px Arial, sans-serif'
  ctx.fillStyle = '#6b7280'
  const subtitle = [ticketTypeName, eventDate, venueName].filter(Boolean).join(' · ')
  ctx.fillText(subtitle, width / 2, y)
  y += 26

  if (attendeeName) {
    ctx.font = 'bold 14px Arial, sans-serif'
    ctx.fillStyle = '#f97316'
    ctx.fillText(`Attendee: ${attendeeName}`, width / 2, y)
    y += 30
  } else {
    y += 6
  }

  // QR box
  const qrSize = 230
  const qrBoxPadding = 16
  const qrBoxSize = qrSize + qrBoxPadding * 2
  const qrBoxX = width / 2 - qrBoxSize / 2
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 2
  roundRect(ctx, qrBoxX, y, qrBoxSize, qrBoxSize, 16)
  ctx.stroke()

  const qrDataUrl = await QRCode.toDataURL(ticketCode, { width: qrSize, margin: 0, color: { dark: '#111827', light: '#ffffff' } })
  const qrImg = await loadImage(qrDataUrl)
  ctx.drawImage(qrImg, qrBoxX + qrBoxPadding, y + qrBoxPadding, qrSize, qrSize)

  y += qrBoxSize + 36

  ctx.font = 'bold 16px monospace'
  ctx.fillStyle = '#374151'
  ctx.fillText(ticketCode, width / 2, y)
  y += 30

  // Dashed line
  ctx.strokeStyle = '#e5e7eb'
  ctx.setLineDash([6, 6])
  ctx.beginPath()
  ctx.moveTo(30, y)
  ctx.lineTo(width - 30, y)
  ctx.stroke()
  ctx.setLineDash([])
  y += 28

  ctx.font = '12px Arial, sans-serif'
  ctx.fillStyle = '#9ca3af'
  ctx.fillText('Present this QR code at entry', width / 2, y)

  return canvas
}

export async function downloadTicketImage(data: TicketImageData) {
  const canvas = await generateTicketCanvas(data)
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = `paddymeet-ticket-${data.ticketCode}.png`
  link.click()
}

export async function downloadTicketPDF(data: TicketImageData) {
  const canvas = await generateTicketCanvas(data)
  const imgData = canvas.toDataURL('image/png')
  const { default: jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] })
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(`paddymeet-ticket-${data.ticketCode}.pdf`)
}