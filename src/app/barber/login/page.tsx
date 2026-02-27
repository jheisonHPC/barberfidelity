'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scissors, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function BarberLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getSafeNextPath = () => {
    if (typeof window === 'undefined') return '/barber'
    const rawNext = new URLSearchParams(window.location.search).get('next') || '/barber'
    const isSafeRelativePath =
      rawNext.startsWith('/')
      && !rawNext.startsWith('//')
      && !rawNext.includes('\\')
    return isSafeRelativePath ? rawNext : '/barber'
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError('Credenciales inválidas')
        return
      }

      router.replace(getSafeNextPath())
      router.refresh()
    } catch {
      setError('No se pudo iniciar sesión. Revisa tu configuración de Supabase.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <Scissors className="w-8 h-8 text-gray-950" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Panel Barbero</h1>
          <p className="text-gray-500 text-sm">Inicia sesión con Supabase Auth</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2 ml-1">
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tu-barberia.com"
              className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl py-4 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2 ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu password"
              className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl py-4 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-950 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
