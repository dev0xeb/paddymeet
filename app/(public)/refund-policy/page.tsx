import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Learn about Paddymeet\'s ticket refund and cancellation policy.',
}

export default function RefundPolicyPage() {
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
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Refund Policy</h1>
          <p className="text-sm text-gray-500">Last updated: June 2025</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 space-y-8 text-sm text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">1. General Policy</h2>
            <p>All ticket sales on Paddymeet are generally final. We do not offer refunds for change of mind or personal circumstances. However, we have specific policies for event cancellations, postponements, and other exceptional circumstances as described below.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">2. Event Cancellations</h2>
            <p>If an event is cancelled by the organiser, you are entitled to a full refund of the ticket price. Service fees charged by Paddymeet are non-refundable. Refunds will be processed to your original payment method within 5 to 10 business days.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">3. Event Postponements</h2>
            <p>If an event is postponed to a new date:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                'Your ticket automatically remains valid for the new date',
                'If you are unable to attend the new date, you may request a refund within 7 days of the postponement announcement',
                'Refund requests after 7 days will not be accepted',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">4. No-Show Policy</h2>
            <p>If you purchase a ticket but do not attend the event, no refund will be issued. It is your responsibility to arrive on time and comply with the event&apos;s entry requirements.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">5. Denied Entry</h2>
            <p>If you are denied entry to an event due to non-compliance with age restrictions, dress code, or other event rules set by the organiser, no refund will be issued. Paddymeet is not responsible for entry decisions made by event organisers or venue staff.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">6. Group Tickets</h2>
            <p>For group ticket purchases:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                'If the group does not fill up by the organiser\'s deadline, affected members will be contacted with options',
                'Payments held by Paddymeet will be refunded if a group cannot be completed',
                'Once a group is complete and tickets have been issued, no refunds are available',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">7. Service Fees</h2>
            <p>Paddymeet charges a service fee on all ticket purchases. This fee covers payment processing, platform maintenance, and customer support. Service fees are non-refundable in all circumstances, including event cancellations.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">8. How to Request a Refund</h2>
            <p>To request a refund, contact us through the support chat on the Platform or email us at support@paddymeet.com with your order details. Include your ticket code and a brief explanation. We will review your request and respond within 2 business days.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">9. Contact Us</h2>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-bold text-gray-900">Paddymeet Inc — Support Team</p>
              <p>Email: support@paddymeet.com</p>
              <p>14 Bode Thomas Street, Surulere, Lagos, Nigeria</p>
            </div>
          </section>

        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-gray-400">
          <Link href="/terms" className="hover:text-orange-500 transition-colors">Terms of Use</Link>
          <span>·</span>
          <Link href="/privacy-policy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/cookie-policy" className="hover:text-orange-500 transition-colors">Cookie Policy</Link>
        </div>
      </div>
    </div>
  )
}