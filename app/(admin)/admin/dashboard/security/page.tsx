import MfaSetup from '@/components/admin/MfaSetup'

export default function AdminSecurityPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Account Security</h1>
        <p className="text-xs text-slate-500">Manage two-factor authentication for your own admin login.</p>
      </div>

      <MfaSetup />
    </div>
  )
}
