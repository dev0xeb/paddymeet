import Link from 'next/link'
import { ArrowLeft, Shield, Star, Eye, Lock, UserCheck, AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trust and Safety',
  description: 'Learn how Paddymeet keeps you safe while protecting your privacy.',
}

export default function TrustSafetyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-10 bg-white border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <Link href="/signup" className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors">
          Get Started
        </Link>
      </nav>

      <div className="pt-16">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-20 px-4 md:px-10 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-orange-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              Trust &amp; Safety
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Your safety is our priority. Here is how we protect you and your privacy on Paddymeet.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-10 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: UserCheck,
                title: 'Verified Accounts',
                desc: 'Every user on Paddymeet goes through a verification process at sign up. We collect basic identity information to ensure all users are real people. Age restrictions on events are automatically enforced.',
              },
              {
                icon: Eye,
                title: 'Anonymous Profiles',
                desc: 'Your real name and face are never visible to other users. Only your username and avatar are shown publicly. You decide how much or how little you share with your groups.',
              },
              {
                icon: Star,
                title: 'Trust Score System',
                desc: 'Our trust score system rewards good behaviour. The more events you attend and groups you participate in positively, the higher your score. Higher scores unlock access to exclusive events and groups.',
              },
              {
                icon: Lock,
                title: 'Secure Payments',
                desc: 'All payments on Paddymeet are processed by certified payment partners using bank-grade encryption. We never store your card details. Funds are held securely until tickets are issued.',
              },
              {
                icon: Shield,
                title: 'Event Screening',
                desc: 'Every event submitted by an organiser is reviewed by the Paddymeet team before going live. We verify organiser credentials and check event details to protect attendees from fraudulent listings.',
              },
              {
                icon: AlertCircle,
                title: 'Report and Block',
                desc: 'You can report any user, group, or event that makes you feel unsafe. Our support team reviews all reports promptly. You can also block users from contacting you at any time.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 bg-white border border-gray-100 rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all">
                <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-base font-extrabold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 bg-orange-50 border border-orange-100 rounded-2xl text-center">
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Need help or want to report something?</h2>
            <p className="text-sm text-gray-500 mb-6">Our support team is available to help. Use the chat bubble on any page or email us directly.</p>
            <a href="mailto:support@paddymeet.com" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}