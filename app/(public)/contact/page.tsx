import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Logo from '@/components/Logo'
import ContactSection from '@/components/contact/ContactSection'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Paddymeet team.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-10 bg-white border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          <Logo theme="color" className="h-7 w-auto" />
        </Link>
        <Link href="/signup" className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors">
          Get Started
        </Link>
      </nav>

      <div className="pt-16 max-w-4xl mx-auto px-4 md:px-10 py-20">
        <div className="text-center mb-14">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">Get in Touch</h1>
          <p className="text-gray-500 leading-relaxed">We would love to hear from you. Choose the right channel below.</p>
        </div>

        <ContactSection />
      </div>
    </div>
  )
}