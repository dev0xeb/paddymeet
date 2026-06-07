'use client'

import { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function Progress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

useEffect(() => {
  const t0 = setTimeout(() => { setLoading(true); setProgress(30) }, 0)
  const t1 = setTimeout(() => setProgress(70), 100)
  const t2 = setTimeout(() => setProgress(90), 300)
  const t3 = setTimeout(() => {
    setProgress(100)
    setTimeout(() => { setLoading(false); setProgress(0) }, 200)
  }, 500)
  return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
}, [pathname, searchParams])

  if (!loading && progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-0.5 bg-transparent pointer-events-none">
      <div
        className="h-full bg-orange-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: loading ? 1 : 0 }}
      />
    </div>
  )
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <Progress />
    </Suspense>
  )
}