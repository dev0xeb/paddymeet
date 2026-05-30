import Link from 'next/link'

export default function HomePage() {
  return (
    <main>
      <h1>Paddymeet</h1>
      <p>Find your crew. Experience the night.</p>
      <Link href="/signup">Get Started</Link>
    </main>
  )
}