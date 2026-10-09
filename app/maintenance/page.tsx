import { Wrench } from 'lucide-react'
import Logo from '@/components/Logo'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Logo theme="color" className="h-8 w-auto mx-auto mb-8" />
        <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Wrench className="w-7 h-7 text-orange-500" />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">
          We&apos;ll be right back
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Paddymeet is undergoing scheduled maintenance. Ticket checkouts and
          account access are temporarily paused. Please check back shortly.
        </p>
      </div>
    </div>
  )
}
