import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const [key, ...vals] = trimmed.split('=')
  if (key && vals.length > 0) {
    env[key.trim()] = vals.join('=').trim()
  }
}

const resendKey = env.RESEND_API_KEY

async function fetchRecentEmails() {
  if (!resendKey) {
    console.log('No RESEND_API_KEY found in .env.local')
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      }
    })
    const data = await res.json()
    console.log('Resend response:', JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Error fetching from Resend:', err)
  }
}

fetchRecentEmails()
