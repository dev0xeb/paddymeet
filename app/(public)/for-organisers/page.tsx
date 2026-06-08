import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle, TrendingUp, Users, Shield, Ticket, BarChart2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Organisers',
  description: 'List your events on Paddymeet and reach thousands of nightlife lovers across Nigeria.',
}

export default function ForOrganisersPage() {
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
          List Your Event
        </Link>
      </nav>

      <div className="pt-16">
        {/* Hero */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-24 px-4 md:px-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-bold text-blue-400 uppercase tracking-wider mb-6">
              For Event Organisers
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
              Reach thousands of nightlife<br />lovers across <span className="text-orange-500">Nigeria</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-10">
              Paddymeet connects your events with verified, engaged attendees. Sell tickets, manage groups, track revenue and get paid — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="flex items-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all hover:shadow-xl hover:shadow-orange-200 w-full sm:w-auto justify-center">
                Start Listing Events <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="mailto:organisers@paddymeet.com" className="px-8 py-4 border-2 border-gray-600 text-gray-300 font-semibold rounded-full hover:border-orange-500 hover:text-orange-400 transition-all w-full sm:w-auto text-center">
                Talk to Our Team
              </a>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="max-w-5xl mx-auto px-4 md:px-10 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">Why list on Paddymeet?</h2>
            <p className="text-gray-500">Everything you need to run successful events in Nigeria</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {[
              { icon: Users, title: 'Verified Audience', desc: 'Every attendee on Paddymeet is verified. Reach real, engaged nightlife lovers who actually show up.' },
              { icon: Ticket, title: 'Easy Ticket Sales', desc: 'Set up multiple ticket types, group tickets, and pricing in minutes. We handle payment processing.' },
              { icon: TrendingUp, title: 'Real-Time Analytics', desc: 'Track ticket sales, revenue, and attendee data from your organiser dashboard in real time.' },
              { icon: Shield, title: 'Secure Payouts', desc: 'Funds are held securely and paid out to your bank account within 48 to 72 hours after your event.' },
              { icon: BarChart2, title: 'Group Coordination', desc: 'Attendees can form groups around your event. This drives community and repeat attendance.' },
              { icon: CheckCircle, title: 'Dedicated Support', desc: 'Our team reviews every event and is available to help you set up and manage your listings.' },
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

          {/* How it works for organisers */}
          <div className="bg-gray-50 rounded-3xl p-8 md:p-12 mb-20">
            <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { n: '1', title: 'Create Account', desc: 'Sign up as an organiser and complete your profile. Our team verifies your account.' },
                { n: '2', title: 'Submit Event', desc: 'Fill in your event details, set ticket types and prices. We review and approve within 48 hours.' },
                { n: '3', title: 'Sell Tickets', desc: 'Your event goes live and attendees can discover and buy tickets through Paddymeet.' },
                { n: '4', title: 'Get Paid', desc: 'After your event, your payout is processed to your registered bank account automatically.' },
              ].map(({ n, title, desc }) => (
                <div key={n} className="text-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg mx-auto mb-4">{n}</div>
                  <h3 className="text-sm font-extrabold text-gray-900 mb-2">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Ready to list your first event?</h2>
            <p className="text-gray-500 mb-8">Join the growing community of event organisers on Paddymeet.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all hover:shadow-xl hover:shadow-orange-200">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}