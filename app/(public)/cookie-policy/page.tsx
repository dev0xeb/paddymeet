import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Learn how Paddymeet uses cookies and similar technologies.',
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-10 bg-white border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="w-20" />
      </nav>

      <div className="pt-16 max-w-3xl mx-auto px-4 md:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Cookie Policy</h1>
          <p className="text-sm text-gray-500">Last updated: June 2025</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 space-y-8 text-sm text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">1. What Are Cookies</h2>
            <p>Cookies are small text files that are placed on your device when you visit a website. They help websites remember your preferences, keep you logged in, and understand how you use the site. Paddymeet uses cookies and similar tracking technologies to improve your experience on our Platform.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">2. Types of Cookies We Use</h2>
            <div className="space-y-4">
              {[
                { name: 'Essential Cookies', desc: 'These are necessary for the Platform to function. They allow you to stay logged in, navigate between pages, and use core features. You cannot opt out of these cookies.' },
                { name: 'Preference Cookies', desc: 'These remember your settings and preferences such as your city, interests, and display options so you don\'t have to set them every time.' },
                { name: 'Analytics Cookies', desc: 'These help us understand how visitors use Paddymeet — which pages are most visited, how long users stay, and where they come from. This data is used to improve the Platform.' },
                { name: 'Security Cookies', desc: 'These help protect you and Paddymeet from fraud and unauthorised access. They help us detect and prevent suspicious activity.' },
              ].map(({ name, desc }) => (
                <div key={name} className="p-4 bg-gray-50 rounded-xl">
                  <p className="font-bold text-gray-900 mb-1">{name}</p>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">3. How to Control Cookies</h2>
            <p>You can control and delete cookies through your browser settings. Most browsers allow you to:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                'See what cookies are stored and delete them individually',
                'Block third-party cookies',
                'Block all cookies from specific sites',
                'Block all cookies from being set',
                'Delete all cookies when you close your browser',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />{item}</li>
              ))}
            </ul>
            <p className="mt-3">Please note that disabling cookies may affect the functionality of Paddymeet. Some features may not work correctly without cookies enabled.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">4. Contact Us</h2>
            <p>If you have questions about our use of cookies, contact us at:</p>
            <div className="mt-3 p-4 bg-gray-50 rounded-xl">
              <p className="font-bold text-gray-900">Paddymeet Inc</p>
              <p>Email: privacy@paddymeet.com</p>
            </div>
          </section>

        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-gray-400">
          <Link href="/terms" className="hover:text-orange-500 transition-colors">Terms of Use</Link>
          <span>·</span>
          <Link href="/privacy-policy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/refund-policy" className="hover:text-orange-500 transition-colors">Refund Policy</Link>
        </div>
      </div>
    </div>
  )
}