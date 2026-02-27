'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarberScanner } from '@/components/BarberScanner'
import {
  Scissors,
  Gift,
  Lock,
  Unlock,
  LogOut,
  User,
  Phone,
  Award,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { createClient } from '@/lib/supabase/client'

interface UserData {
  id: string
  name: string
  phone: string
  stamps: number
  totalCuts: number
  canRedeem: boolean
  scanToken?: string
}

export default function BarberPage() {
  const router = useRouter()
  const [scannedUser, setScannedUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/barber/login')
    router.refresh()
  }

  const handleScanSuccess = (user: UserData) => {
    setScannedUser(user)
    setMessage(null)
  }

  const handleAddStamp = async () => {
    if (!scannedUser) return
    if (!scannedUser.scanToken) {
      setMessage({ type: 'error', text: 'Escanea un QR vigente del cliente para continuar.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/users/${scannedUser.id}/stamp`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-requested-with': 'barber-fidelity',
        },
        body: JSON.stringify({ scanToken: scannedUser.scanToken }),
      })

      const data = await response.json()

      if (response.ok) {
        setScannedUser(data.user)
        setMessage({ type: 'success', text: data.message })

        if (data.justCompleted) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#10b981', '#ffffff'],
          })
        }
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!scannedUser) return
    if (!scannedUser.scanToken) {
      setMessage({ type: 'error', text: 'Escanea un QR vigente del cliente para continuar.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/users/${scannedUser.id}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-requested-with': 'barber-fidelity',
        },
        body: JSON.stringify({ scanToken: scannedUser.scanToken }),
      })

      const data = await response.json()

      if (response.ok) {
        setScannedUser(data.user)
        setMessage({ type: 'success', text: data.message })

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#ffffff'],
        })
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  const resetScan = () => {
    setScannedUser(null)
    setMessage(null)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900/50 border-b border-gray-800/50 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Scissors className="w-5 h-5 text-gray-950" />
            </div>
            <div>
              <h1 className="text-white font-bold">Panel Barbero</h1>
              <p className="text-gray-500 text-xs">Escanea QR del cliente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/barber/camera-test"
              className="text-gray-400 hover:text-white text-xs px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              Probar cámara
            </Link>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-6">
        {!scannedUser ? (
          <>
            <div className="text-center mb-6">
              <h2 className="text-white font-bold text-lg mb-2">Escanear Cliente</h2>
              <p className="text-gray-500 text-sm">Apunta la cámara al código QR del cliente</p>
            </div>

            <BarberScanner onScanSuccess={handleScanSuccess} />

            <div className="mt-6 bg-gray-900/30 rounded-2xl p-4 border border-gray-800/50">
              <h3 className="text-gray-400 text-sm font-medium mb-3">Instrucciones:</h3>
              <ol className="text-gray-500 text-sm space-y-2">
                <li className="flex items-start gap-3">
                  <span className="bg-gray-800 text-gray-400 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Pide al cliente que abra su tarjeta digital</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-gray-800 text-gray-400 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Escanea el QR que muestra en su pantalla</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-gray-800 text-gray-400 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>Si tiene 5 sellos, canjea su corte gratis</span>
                </li>
              </ol>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <button
              onClick={resetScan}
              className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
            >
              ← Escanear otro cliente
            </button>

            <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 rounded-3xl p-6 border border-gray-800/50 backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-center">
                  <User className="w-7 h-7 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">{scannedUser.name}</h3>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Phone className="w-4 h-4" />
                    <span>{scannedUser.phone}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 mb-6">
                {Array.from({ length: 5 }).map((_, index) => {
                  const isStamped = index < scannedUser.stamps
                  return (
                    <div
                      key={index}
                      className={`
                        aspect-square rounded-xl flex items-center justify-center
                        ${isStamped
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                          : 'bg-gray-800 border-2 border-dashed border-gray-700'
                        }
                      `}
                    >
                      {isStamped && <Scissors className="w-5 h-5 text-gray-950" />}
                    </div>
                  )
                })}

                <div
                  className={`
                    aspect-square rounded-xl flex items-center justify-center
                    ${scannedUser.canRedeem
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                      : 'bg-gray-800 border-2 border-dashed border-gray-700'
                    }
                  `}
                >
                  {scannedUser.canRedeem ? (
                    <Unlock className="w-5 h-5 text-white" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Progreso</span>
                <span className={scannedUser.canRedeem ? 'text-green-400 font-bold' : 'text-amber-500 font-bold'}>
                  {scannedUser.stamps}/5
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    scannedUser.canRedeem
                      ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                      : 'bg-gradient-to-r from-amber-600 to-amber-400'
                  }`}
                  style={{ width: `${Math.min((scannedUser.stamps / 5) * 100, 100)}%` }}
                />
              </div>
            </div>

            {!scannedUser.canRedeem ? (
              <button
                onClick={handleAddStamp}
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-500/20"
              >
                <Scissors className="w-5 h-5" />
                {loading ? 'Procesando...' : 'AGREGAR SELLO (+1)'}
              </button>
            ) : (
              <button
                onClick={handleRedeem}
                disabled={loading}
                className="w-full py-5 px-6 rounded-2xl font-bold text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-green-500/20 animate-pulse"
              >
                <Gift className="w-6 h-6" />
                {loading ? 'Procesando...' : 'CANJEAR CORTE GRATIS'}
              </button>
            )}

            {message && (
              <div
                className={`rounded-2xl p-4 flex items-start gap-3 ${
                  message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <p className={message.type === 'success' ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
                  {message.text}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800/50 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-2xl font-bold text-white">{scannedUser.stamps}</span>
                </div>
                <p className="text-gray-500 text-xs">Sellos actuales</p>
              </div>
              <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800/50 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Scissors className="w-4 h-4 text-amber-500" />
                  <span className="text-2xl font-bold text-amber-500">{scannedUser.totalCuts}</span>
                </div>
                <p className="text-gray-500 text-xs">Cortes totales</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
