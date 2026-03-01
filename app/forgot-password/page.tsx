import ForgotPasswordClient from "./ForgotPasswordClient"

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h1 className="text-xl font-semibold">Forgot password</h1>
        <ForgotPasswordClient />
      </div>
    </main>
  )
}
