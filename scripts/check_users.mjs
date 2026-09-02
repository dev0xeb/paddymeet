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

async function checkAll() {
  console.log('--- SUPABASE AUTH USERS ---')
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers()
  if (authErr) console.error('Auth error:', authErr)
  else {
    authUsers.users.forEach(u => {
      console.log(`Auth ID: ${u.id} | Email: ${u.email} | Created: ${u.created_at}`)
    })
  }

  console.log('\n--- PUBLIC.USERS (Explorers / Admins) ---')
  const { data: users, error: userErr } = await supabase.from('users').select('*')
  if (userErr) console.error('User table error:', userErr)
  else console.log(JSON.stringify(users, null, 2))

  console.log('\n--- PUBLIC.ORGANISERS (Event Hosts) ---')
  const { data: orgs, error: orgErr } = await supabase.from('organisers').select('*')
  if (orgErr) console.error('Organiser table error:', orgErr)
  else console.log(JSON.stringify(orgs, null, 2))
}

checkAll()
