'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Download, Check, FileText } from 'lucide-react'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Props {
  ticketCode: string
  eventTitle: string
  ticketTypeName: string
  eventDate: string
  venueName?: string
}

export default function TicketQRModal({ ticketCode, eventTitle, ticketTypeName, eventDate, venueName }: Props) {
  const [open, setOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const ticketRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && ticketCode) {
      QRCode.toDataURL(ticketCode, {
        width: 280,
        margin: 1,
        color: { dark: '#111827', light: '#ffffff' },
      }).then(setQrDataUrl)
    }
  }, [open, ticketCode])

  const handleDownloadImage = async () => {
    if (!ticketRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(ticketRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `paddymeet-ticket-${ticketCode}.png`
      link.click()
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 2000)
    } catch {
      // silent fail
    }
    setDownloading(false)
  }

  const handleDownloadPDF = async () => {
    if (!ticketRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(ticketRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`paddymeet-ticket-${ticketCode}.pdf`)
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 2000)
    } catch {
      // silent fail
    }
    setDownloading(false)
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

          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-sm font-extrabold text-gray-900">Your Ticket</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {/* Ticket card — this is what gets captured for download */}
              <div ref={ticketRef} className="bg-white rounded-2xl overflow-hidden border-2 border-gray-100">
                <div className="bg-gradient-to-br from-orange-500 to-pink-500 px-5 py-4 text-center">
                  <div className="text-base font-extrabold text-white tracking-tight">
                    paddy<span className="text-gray-900">meet</span>
                  </div>
                </div>
                <div className="p-5 text-center">
                  <div className="text-sm font-extrabold text-gray-900 mb-1">{eventTitle}</div>
                  <div className="text-xs text-gray-500 mb-4">{ticketTypeName} · {eventDate}{venueName ? ` · ${venueName}` : ''}</div>

                  <div className="bg-white border-2 border-gray-100 rounded-2xl p-3 inline-block mb-3">
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrDataUrl} alt="Ticket QR Code" className="w-52 h-52" />
                    ) : (
                      <div className="w-52 h-52 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="text-xs font-mono font-extrabold text-gray-700 tracking-widest">{ticketCode}</div>
                </div>
                <div className="border-t border-dashed border-gray-200 px-5 py-3 text-center">
                  <p className="text-xs text-gray-400">Present this QR code at entry</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4 mb-4 text-center leading-relaxed">
                Save this ticket to your phone or download as PDF for easy access at the event.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleDownloadImage}
                  disabled={downloading || !qrDataUrl}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {downloaded ? <><Check className="w-3.5 h-3.5" /> Saved</> : <><Download className="w-3.5 h-3.5" /> Save Image</>}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading || !qrDataUrl}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5" /> Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}