import { createClient } from '@supabase/supabase-js'
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function setOrganiserPassword() {
  const email = 'bigcdesigns8@gmail.com'
  const newPassword = 'PaddyHost2026!'

  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('List error:', listError)
    return
  }

  const user = usersData.users.find(u => u.email === email)
  if (!user) {
    console.error('User not found in auth:', email)
    return
  }

  console.log(`Setting password for ${email} (ID: ${user.id})...`)
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
    email_confirm: true
  })

  if (error) {
    console.error('Error updating password:', error)
  } else {
    console.log(`SUCCESS: Password for ${email} is now: ${newPassword}`)
  }
}

setOrganiserPassword()
