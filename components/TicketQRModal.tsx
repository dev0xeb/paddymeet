'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Download, Check } from 'lucide-react'
import QRCode from 'qrcode'

interface Props {
  ticketCode: string
  eventTitle: string
  ticketTypeName: string
  eventDate: string
}

export default function TicketQRModal({ ticketCode, eventTitle, ticketTypeName, eventDate }: Props) {
  const [open, setOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [downloaded, setDownloaded] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (open && ticketCode) {
      QRCode.toDataURL(ticketCode, {
        width: 300,
        margin: 2,
        color: { dark: '#111827', light: '#ffffff' },
      }).then(setQrDataUrl)
    }
  }, [open, ticketCode])

  const handleDownload = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `paddymeet-ticket-${ticketCode}.png`
    link.click()
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors"
      >
        Show QR Code
      </button>

      {open && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-extrabold text-gray-900">Entry QR Code</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 text-center">
              <div className="text-sm font-bold text-gray-900 mb-1 truncate">{eventTitle}</div>
              <div className="text-xs text-gray-500 mb-5">{ticketTypeName} · {eventDate}</div>

              <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 inline-block mb-4">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="Ticket QR Code" className="w-56 h-56" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="text-xs font-mono font-extrabold text-gray-700 tracking-widest mb-5">{ticketCode}</div>

              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Show this code at the entrance for quick check-in. You can also save it to your phone.
              </p>

              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors"
              >
                {downloaded ? <><Check className="w-4 h-4" /> Saved!</> : <><Download className="w-4 h-4" /> Save to Device</>}
              </button>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </>
  )
}