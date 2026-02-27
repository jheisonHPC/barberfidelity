'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Scissors, User, Phone, ArrowRight, Sparkles } from 'lucide-react'

export default function RegistrationPage() {
  const params = useParams()
  const router = useRouter()
  const businessSlug = params.businessSlug as string

  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatPhone = (value: string) => {
    // Remove non-numeric characters
    const numeric = value.replace(/\D/g, '')
    // Limit to 10 digits
    return numeric.slice(0, 10)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-requested-with': 'barber-fidelity',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          businessSlug
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Redirigir a la tarjeta digital del usuario
        router.push(`/${businessSlug}/card/${data.user.id}`)
      } else if (response.status === 409 && data.user) {
        // Usuario ya existe, redirigir a su tarjeta
        router.push(`/${businessSlug}/card/${data.user.id}`)
      } else {
        setError(data.error || 'Error al crear cuenta')
        setLoading(false)
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const isPhoneValid = formData.phone.length === 10
  const isNameValid = formData.name.trim().length >= 2
  const isFormValid = isPhoneValid && isNameValid

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/50 border-b border-gray-800/50 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Scissors className="w-5 h-5 text-gray-950" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Club de Fidelidad</h1>
              <p className="text-gray-500 text-xs capitalize">{businessSlug.replace(/-/g, ' ')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Hero Card */}
        <div className="w-full max-w-md">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-amber-400 text-sm font-medium">5 cortes = 1 GRATIS</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">
              Únete al Club
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Acumula sellos con cada visita y obtén tu sexto corte completamente gratis.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div className="group">
              <label className="block text-gray-400 text-sm font-medium mb-2 ml-1">
                Nombre completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Carlos Rodríguez"
                  required
                  className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 focus:ring-4 focus:ring-amber-500/10 transition-all"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="group">
              <label className="block text-gray-400 text-sm font-medium mb-2 ml-1">
                Número de teléfono
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  placeholder="10 dígitos (ej: 5512345678)"
                  required
                  minLength={10}
                  maxLength={10}
                  className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 focus:ring-4 focus:ring-amber-500/10 transition-all"
                />
              </div>
              <p className="text-gray-600 text-xs mt-2 ml-1">
                Usaremos tu teléfono para identificar tu cuenta en futuras visitas.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full mt-6 py-4 px-6 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creando cuenta...
                </span>
              ) : (
                <>
                  Crear mi tarjeta digital
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Benefits */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { icon: '💈', title: '5 + 1', desc: 'Cortes gratis' },
              { icon: '📱', title: 'Digital', desc: 'Siempre contigo' },
              { icon: '⚡', title: 'Rápido', desc: 'Sin esperas' },
            ].map((benefit, index) => (
              <div 
                key={index}
                className="bg-gray-900/30 rounded-2xl p-4 text-center border border-gray-800/50 backdrop-blur-sm"
              >
                <div className="text-2xl mb-2">{benefit.icon}</div>
                <p className="text-white font-semibold text-sm">{benefit.title}</p>
                <p className="text-gray-500 text-xs">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-gray-600 text-xs">
          Al registrarte aceptas los términos y condiciones del programa.
        </p>
      </footer>
    </div>
  )
}

