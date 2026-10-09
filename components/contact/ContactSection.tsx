'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, MessageCircle, ChevronDown, ArrowUpRight } from 'lucide-react'
import SupportChat, { FAQ_CATEGORIES, TOPICS_DATA } from '@/components/SupportChat'

export default function ContactSection() {
  const [openTopicId, setOpenTopicId] = useState<string | null>(null)
  const [chatSignal, setChatSignal] = useState(0)

  const cards: {
    icon: typeof MessageCircle
    title: string
    desc: string
    action: string
    href?: string
    onClick?: () => void
    color: 'orange' | 'blue' | 'purple'
  }[] = [
    {
      icon: MessageCircle,
      title: 'General Support',
      desc: 'For account issues, ticket problems, or general questions about Paddymeet.',
      action: 'Open Support Chat',
      onClick: () => setChatSignal((s) => s + 1),
      color: 'orange',
    },
    {
      icon: Mail,
      title: 'Business Enquiries',
      desc: 'For partnerships, sponsorships, media enquiries, and organiser onboarding.',
      action: 'hello@paddymeet.com',
      href: 'mailto:hello@paddymeet.com',
      color: 'blue',
    },
    {
      icon: Mail,
      title: 'Legal & Privacy',
      desc: 'For data requests, legal matters, and privacy-related concerns.',
      action: 'legal@paddymeet.com',
      href: 'mailto:legal@paddymeet.com',
      color: 'purple',
    },
  ]

  return (
    <>
      {/* FAQs */}
      <div className="mb-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Frequently Asked Questions</h2>
          <p className="text-sm text-gray-500">Quick answers before you reach out — most questions are covered here.</p>
        </div>

        <div className="space-y-8">
          {FAQ_CATEGORIES.map((cat) => {
            const topics = TOPICS_DATA.filter((t) => t.categoryId === cat.id)
            if (topics.length === 0) return null
            return (
              <div key={cat.id}>
                <h3 className="text-xs font-extrabold text-orange-600 uppercase tracking-wider mb-3">{cat.label}</h3>
                <div className="space-y-2">
                  {topics.map((topic) => {
                    const isOpen = openTopicId === topic.id
                    return (
                      <div key={topic.id} className="border border-gray-100 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenTopicId(isOpen ? null : topic.id)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm font-bold text-gray-900">{topic.title}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 space-y-2 bg-gray-50/60">
                            {topic.content.map((paragraph, idx) => (
                              <p key={idx} className="text-sm text-gray-600 leading-relaxed">{paragraph}</p>
                            ))}
                            {topic.actionLink && (
                              <Link
                                href={topic.actionLink.href}
                                className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline pt-1"
                              >
                                {topic.actionLink.label} <ArrowUpRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        {cards.map(({ icon: Icon, title, desc, action, href, onClick, color }) => (
          <div key={title} className="p-6 bg-white border border-gray-100 rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all text-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              color === 'orange' ? 'bg-orange-50' :
              color === 'blue' ? 'bg-blue-50' : 'bg-purple-50'
            }`}>
              <Icon className={`w-5 h-5 ${
                color === 'orange' ? 'text-orange-500' :
                color === 'blue' ? 'text-blue-500' : 'text-purple-500'
              }`} />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">{desc}</p>
            {onClick ? (
              <button type="button" onClick={onClick} className="text-sm font-bold text-orange-500 hover:underline">
                {action}
              </button>
            ) : (
              <a href={href} className="text-sm font-bold text-orange-500 hover:underline">{action}</a>
            )}
          </div>
        ))}
      </div>

      <SupportChat accountType="explorer" openSignal={chatSignal} />
    </>
  )
}
