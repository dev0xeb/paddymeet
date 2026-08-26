import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Parse .env.local manually
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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function seedAdmin() {
  const email = 'admin@paddymeet.com'
  const password = 'PaddyAdmin2026!'
  const fullName = 'PaddyMeet Super Admin'

  console.log(`Checking if admin user exists: ${email}...`)

  // List existing users to find if admin already exists
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('Error listing users:', listError)
    process.exit(1)
  }

  let adminUser = usersData.users.find(u => u.email === email)

  if (adminUser) {
    console.log(`Admin user found (ID: ${adminUser.id}). Updating password...`)
    const { error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, account_type: 'admin' }
    })
    if (updateError) {
      console.error('Error updating password:', updateError)
    } else {
      console.log('Admin user password updated successfully.')
    }
  } else {
    console.log('Creating new admin user in Supabase Auth...')
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, account_type: 'admin' }
    })

    if (createError) {
      console.error('Error creating admin user:', createError)
      process.exit(1)
    }
    adminUser = createData.user
    console.log(`Admin user created with ID: ${adminUser.id}`)
  }

  // Insert or update in public.admin_team
  console.log('Registering in public.admin_team table...')
  const { data: teamData, error: teamError } = await supabase
    .from('admin_team')
    .upsert({
      id: adminUser.id,
      full_name: fullName,
      email,
      department: 'super_admin',
      is_active: true,
    }, { onConflict: 'id' })

  if (teamError) {
    console.error('Error registering in admin_team:', teamError)
    process.exit(1)
  }

  console.log('\n=============================================')
  console.log(' SUCCESS: Admin Account Ready!')
  console.log(' Portal URL: http://localhost:3001/admin-login')
  console.log(` Email:      ${email}`)
  console.log(` Password:   ${password}`)
  console.log(' Role:       super_admin')
  console.log('=============================================\n')
}

seedAdmin()
