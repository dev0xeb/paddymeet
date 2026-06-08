import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Read the terms and conditions for using Paddymeet.',
}

export default function TermsPage() {
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
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Terms of Use</h1>
          <p className="text-sm text-gray-500">Last updated: June 2025</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 space-y-8 text-sm text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">1. Agreement to Terms</h2>
            <p>By accessing or using Paddymeet (&quot;Platform&quot;), you agree to be bound by these Terms of Use. These terms apply to all visitors, users, and others who access or use the Platform. If you disagree with any part of these terms, you do not have permission to access the Platform.</p>
            <p className="mt-3">Paddymeet is operated by <strong>Paddymeet Inc</strong>, registered in Nigeria, with offices at 14 Bode Thomas Street, Surulere, Lagos, Nigeria.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">2. Use of the Platform</h2>
            <p>Paddymeet is a nightlife event discovery and group coordination platform. By using Paddymeet you agree to:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                'Provide accurate, truthful information when creating your account',
                'Be at least 18 years of age, or the minimum legal age in your jurisdiction',
                'Not use the Platform for any unlawful or prohibited purpose',
                'Not attempt to gain unauthorised access to any part of the Platform',
                'Not harass, abuse, or harm other users',
                'Respect the privacy of other users and not share their personal information',
                'Not create fake accounts or misrepresent your identity',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">3. Accounts</h2>
            <p>When you create an account with Paddymeet, you must provide accurate and complete information. You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorised use of your account.</p>
            <p className="mt-3">Paddymeet reserves the right to suspend or terminate accounts that violate these terms or engage in behaviour deemed harmful to other users or the Platform.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">4. Tickets and Payments</h2>
            <p>All ticket purchases made through Paddymeet are processed securely via our payment partners. By purchasing a ticket you agree to the following:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                'Ticket prices are set by event organisers and may be subject to service fees',
                'All sales are final unless the event is cancelled by the organiser',
                'Paddymeet acts as an intermediary between buyers and organisers',
                'Tickets are non-transferable unless explicitly permitted by the organiser',
                'Paddymeet is not responsible for the quality or conduct of third-party events',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">5. Refunds and Cancellations</h2>
            <p>Refunds are governed by our Refund Policy. In general:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                'If an event is cancelled by the organiser, you will receive a full refund',
                'If an event is postponed, your ticket remains valid for the new date',
                'No refunds are issued after an event has taken place',
                'Service fees are non-refundable',
                'Refund processing may take 5 to 10 business days',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">6. Groups and Community</h2>
            <p>Paddymeet allows users to create and join groups around events. By participating in groups you agree to:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                'Treat all group members with respect and dignity',
                'Not share offensive, harmful, or illegal content in group chats',
                'Not use groups to spam, solicit, or advertise without permission',
                'Report any abuse or violations to Paddymeet support',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">7. Organisers</h2>
            <p>Event organisers who use Paddymeet agree to additional terms including:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                'All event listings must be accurate and not misleading',
                'Events must comply with all applicable Nigerian laws and regulations',
                'Organisers are responsible for obtaining all necessary permits and licences',
                'Paddymeet reviews all events before they go live and reserves the right to reject any listing',
                'Payouts are made after deducting Paddymeet commission as agreed',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">8. Intellectual Property</h2>
            <p>The Platform and its original content, features, and functionality are owned by Paddymeet Inc and are protected by Nigerian and international intellectual property laws. You may not copy, modify, distribute, or reproduce any part of the Platform without our prior written consent.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p>Paddymeet shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform. We do not guarantee the safety or conduct of any event or its attendees. Your use of the Platform is at your own risk.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">10. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. We will notify users of significant changes by posting a notice on the Platform. Your continued use of the Platform after any changes constitutes your acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">11. Contact Us</h2>
            <p>If you have any questions about these Terms of Use, please contact us at:</p>
            <div className="mt-3 p-4 bg-gray-50 rounded-xl">
              <p className="font-bold text-gray-900">Paddymeet Inc</p>
              <p>14 Bode Thomas Street, Surulere, Lagos, Nigeria</p>
              <p>Email: legal@paddymeet.com</p>
              <p>Website: paddymeet.com</p>
            </div>
          </section>

        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-gray-400">
          <Link href="/privacy-policy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/cookie-policy" className="hover:text-orange-500 transition-colors">Cookie Policy</Link>
          <span>·</span>
          <Link href="/refund-policy" className="hover:text-orange-500 transition-colors">Refund Policy</Link>
        </div>
      </div>
    </div>
  )
}