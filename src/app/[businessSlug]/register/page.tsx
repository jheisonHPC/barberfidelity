'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Crown, User, Phone, Scissors, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const params = useParams()
  const router = useRouter()
  const businessSlug = params.businessSlug as string

  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          businessSlug
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Store user ID in localStorage
        localStorage.setItem(`barber-fidelity-${businessSlug}`, data.user.id)
        setSuccess(true)
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push(`/${businessSlug}`)
        }, 2000)
      } else {
        setError(data.error || 'Error al crear cuenta')
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const formatPhone = (value: string) => {
    // Remove non-numeric characters
    const numeric = value.replace(/\D/g, '')
    // Limit to 10 digits
    return numeric.slice(0, 10)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            ¡Bienvenido!
          </h1>
          <p className="text-gray-400 mb-6">
            Tu cuenta ha sido creada exitosamente. Redirigiendo a tu tarjeta de sellos...
          </p>
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 animate-progress" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-gray-800">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
              <Crown className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <h1 className="text-white font-bold">Tarjeta de Fidelidad</h1>
              <p className="text-gray-500 text-xs">Registro de Cliente</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            ¡Únete y gana cortes gratis!
          </h2>
          <p className="text-gray-500 text-sm">
            5 cortes pagados = 1 corte GRATIS
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Nombre completo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tu nombre"
                required
                className="w-full bg-gray-900 border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Teléfono
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                placeholder="10 dígitos"
                required
                minLength={10}
                maxLength={10}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>
            <p className="text-gray-600 text-xs mt-2">
              Usaremos tu teléfono para identificar tu cuenta
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || formData.name.length < 2 || formData.phone.length < 10}
            className="w-full py-4 px-6 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Creando cuenta...' : 'Crear mi tarjeta de sellos'}
          </button>
        </form>

        {/* Benefits */}
        <div className="mt-12 space-y-4">
          <h3 className="text-gray-400 text-sm font-medium text-center">
            Beneficios de unirte:
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '💈', text: '5 cortes = 1 gratis' },
              { icon: '📱', text: 'Tarjeta digital' },
              { icon: '✨', text: 'Exclusivo para miembros' }
            ].map((benefit, index) => (
              <div 
                key={index}
                className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800"
              >
                <div className="text-2xl mb-2">{benefit.icon}</div>
                <p className="text-gray-500 text-xs">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
