import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Paddymeet collects, uses and protects your personal data.',
}

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: June 2025</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 space-y-8 text-sm text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">1. Introduction</h2>
            <p>Paddymeet Inc (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and share your data when you use the Paddymeet platform. By using Paddymeet, you consent to the practices described in this policy.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <div className="space-y-4">
              <div>
                <p className="font-bold text-gray-900 mb-1">Information you provide:</p>
                <ul className="space-y-1 list-none">
                  {['Full name and username', 'Email address and phone number', 'Date of birth and age', 'City and state of residence', 'Interests and event preferences', 'Payment information (processed securely by our payment partners)', 'Profile photos or avatars you upload'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-1">Information collected automatically:</p>
                <ul className="space-y-1 list-none">
                  {['Device type, browser, and operating system', 'IP address and approximate location', 'Pages visited and features used', 'Time spent on the Platform', 'Referring website or app'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="space-y-2 list-none">
              {[
                'To create and manage your account',
                'To process ticket purchases and payments',
                'To match you with relevant events and groups based on your interests and location',
                'To send you notifications about events, groups, and account activity',
                'To improve and personalise your experience on the Platform',
                'To detect and prevent fraud or abuse',
                'To comply with legal obligations',
                'To communicate with you about product updates and promotions (with your consent)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">4. How We Share Your Information</h2>
            <p className="mb-3">We do not sell your personal data. We may share your information in the following circumstances:</p>
            <ul className="space-y-2 list-none">
              {[
                'With event organisers — only the information necessary to fulfil your ticket purchase',
                'With payment processors — to securely process transactions',
                'With service providers — who help us operate the Platform (hosting, analytics, etc.)',
                'With law enforcement — when required by law or to protect the safety of users',
                'In a business transfer — if Paddymeet is acquired or merged with another company',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">5. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information, including encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure. We encourage you to use a strong password and to keep your account credentials confidential.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">6. Your Rights</h2>
            <p className="mb-3">You have the following rights regarding your personal data:</p>
            <ul className="space-y-2 list-none">
              {[
                'Access — you can request a copy of your personal data',
                'Correction — you can update inaccurate information in your account settings',
                'Deletion — you can request deletion of your account and personal data',
                'Opt-out — you can unsubscribe from marketing communications at any time',
                'Portability — you can request your data in a portable format',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />{item}</li>
              ))}
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at privacy@paddymeet.com.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">7. Data Retention</h2>
            <p>We retain your personal data for as long as your account is active or as needed to provide you with our services. If you delete your account, we will delete or anonymise your data within 30 days, except where we are required to retain it by law.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">8. Children&apos;s Privacy</h2>
            <p>Paddymeet is not intended for users under the age of 18. We do not knowingly collect personal information from anyone under 18. If we discover that a child under 18 has provided us with personal information, we will delete it immediately.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">9. Third-Party Links</h2>
            <p>Our Platform may contain links to third-party websites or services. We are not responsible for the privacy practices of those sites. We encourage you to review the privacy policies of any third-party sites you visit.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting a notice on the Platform or sending you an email. Your continued use of Paddymeet after changes are posted constitutes your acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-gray-900 mb-3">11. Contact Us</h2>
            <p>If you have any questions or concerns about this Privacy Policy, please contact us:</p>
            <div className="mt-3 p-4 bg-gray-50 rounded-xl">
              <p className="font-bold text-gray-900">Paddymeet Inc — Privacy Team</p>
              <p>14 Bode Thomas Street, Surulere, Lagos, Nigeria</p>
              <p>Email: privacy@paddymeet.com</p>
            </div>
          </section>

        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-gray-400">
          <Link href="/terms" className="hover:text-orange-500 transition-colors">Terms of Use</Link>
          <span>·</span>
          <Link href="/cookie-policy" className="hover:text-orange-500 transition-colors">Cookie Policy</Link>
          <span>·</span>
          <Link href="/refund-policy" className="hover:text-orange-500 transition-colors">Refund Policy</Link>
        </div>
      </div>
    </div>
  )
}