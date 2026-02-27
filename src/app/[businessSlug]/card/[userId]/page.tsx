'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Scissors, Gift, Lock, Unlock, Crown, User, Calendar, Award, Bell, X } from 'lucide-react'

interface UserData {
  id: string
  name: string
  phone: string
  stamps: number
  totalCuts: number
  canRedeem: boolean
  businessName: string
  businessSlug: string
}

interface QrTokenData {
  token: string
  expiresAt: string
}

function getReminderStorageKey(userId: string) {
  const today = new Date().toISOString().slice(0, 10)
  return `two-cuts-reminder:${userId}:${today}`
}

export default function DigitalCardPage() {
  const params = useParams()
  const { businessSlug, userId } = params as { businessSlug: string; userId: string }

  const [user, setUser] = useState<UserData | null>(null)
  const [qrToken, setQrToken] = useState<QrTokenData | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReminderToast, setShowReminderToast] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `/api/users/${userId}?businessSlug=${encodeURIComponent(businessSlug)}`
        )

        if (!response.ok) {
          throw new Error('Usuario no encontrado')
        }

        const data = await response.json()
        setUser(data)
      } catch {
        setError('No se pudo cargar la informacion del usuario')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      void fetchUserData()
    }
  }, [businessSlug, userId])

  useEffect(() => {
    if (!userId || !businessSlug) return
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    const refreshToken = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-requested-with': 'barber-fidelity',
          },
          body: JSON.stringify({ businessSlug }),
        })

        if (!response.ok) {
          if (!cancelled) {
            setQrToken(null)
          }
          return
        }

        const data = await response.json()
        if (!cancelled) {
          setQrToken(data)
          const expiresAtMs = new Date(data.expiresAt).getTime()
          setSecondsLeft(Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000)))
        }
      } catch {
        if (!cancelled) {
          setQrToken(null)
          setSecondsLeft(0)
        }
      }
    }

    void refreshToken()
    intervalId = setInterval(() => {
      void refreshToken()
    }, 60_000)

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [businessSlug, userId])

  useEffect(() => {
    if (!qrToken?.expiresAt) return

    const tick = () => {
      const expiresAtMs = new Date(qrToken.expiresAt).getTime()
      setSecondsLeft(Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000)))
    }

    tick()
    const timerId = setInterval(tick, 1000)
    return () => clearInterval(timerId)
  }, [qrToken?.expiresAt])

  useEffect(() => {
    if (!user || user.stamps !== 3) {
      setShowReminderToast(false)
      return
    }

    const storageKey = getReminderStorageKey(user.id)
    const alreadyShownToday = window.localStorage.getItem(storageKey) === '1'
    if (!alreadyShownToday) {
      setShowReminderToast(true)
      window.localStorage.setItem(storageKey, '1')
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Cargando tu tarjeta...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Error</h2>
          <p className="text-gray-400 text-sm">{error || 'Usuario no encontrado'}</p>
        </div>
      </div>
    )
  }

  const filledStamps = user.stamps

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <header className="relative bg-gray-900/50 border-b border-gray-800/50 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-5 h-5 text-gray-950" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">{user.businessName}</h1>
              <p className="text-gray-500 text-xs">Miembro del Club</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-md mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Hola, {user.name.split(' ')[0]}!</h2>
          <p className="text-gray-400 text-sm">
            {user.canRedeem
              ? 'Tienes un corte GRATIS disponible!'
              : `Acumula ${5 - filledStamps} sello${5 - filledStamps !== 1 ? 's' : ''} mas para tu recompensa`}
          </p>
        </div>

        <div className="relative mb-8">
          <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-950/90 rounded-3xl p-6 border border-gray-800/50 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-center">
                  <User className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold">{user.name}</h3>
                  <p className="text-gray-500 text-xs">{user.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-amber-500">
                  <Award className="w-4 h-4" />
                  <span className="font-bold">{user.totalCuts}</span>
                </div>
                <p className="text-gray-600 text-xs">Cortes</p>
              </div>
            </div>

            <div className="relative grid grid-cols-3 gap-3 mb-6">
              {Array.from({ length: 5 }).map((_, index) => {
                const isStamped = index < filledStamps
                return (
                  <div
                    key={index}
                    className={`
                      aspect-square rounded-2xl flex items-center justify-center transition-all duration-500
                      ${isStamped
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 scale-100'
                        : 'bg-gray-800/50 border-2 border-dashed border-gray-700'
                      }
                    `}
                  >
                    {isStamped ? (
                      <Scissors className="w-8 h-8 text-gray-950" />
                    ) : (
                      <span className="text-gray-600 font-bold text-xl">{index + 1}</span>
                    )}
                  </div>
                )
              })}

              <div
                className={`
                  aspect-square rounded-2xl flex items-center justify-center transition-all duration-500
                  ${user.canRedeem
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 border-2 border-green-400'
                    : 'bg-gray-800/50 border-2 border-dashed border-gray-700'
                  }
                `}
              >
                {user.canRedeem ? (
                  <div className="flex flex-col items-center">
                    <Unlock className="w-6 h-6 text-white mb-1" />
                    <span className="text-white text-xs font-bold">GRATIS</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Lock className="w-6 h-6 text-gray-600 mb-1" />
                    <Gift className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            </div>

            <div className="relative mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-xs">Progreso</span>
                <span className={user.canRedeem ? 'text-green-400 font-bold' : 'text-amber-500 font-bold'}>
                  {Math.min(filledStamps, 5)}/5
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`
                    h-full rounded-full transition-all duration-700 ease-out
                    ${user.canRedeem ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-amber-600 to-amber-400'}
                  `}
                  style={{ width: `${Math.min((filledStamps / 5) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-950/80 rounded-3xl p-6 border border-gray-800/50 backdrop-blur-xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-white font-bold">Tu Codigo QR</h3>
              <p className="text-gray-500 text-xs">Muestralo al barbero</p>
            </div>
          </div>

          <div className="flex justify-center py-4">
            <div className="bg-white p-4 rounded-2xl shadow-xl">
              <QRCodeSVG
                value={qrToken?.token || ''}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          <p className="text-gray-500 text-xs text-center">
            Este codigo es temporal y se renueva automaticamente
          </p>
          <p className="text-amber-400 text-xs text-center mt-1">
            Expira en {secondsLeft}s
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800/50 backdrop-blur-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Scissors className="w-4 h-4 text-amber-500" />
              <span className="text-2xl font-bold text-white">{filledStamps}</span>
            </div>
            <p className="text-gray-500 text-xs">Sellos actuales</p>
          </div>
          <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800/50 backdrop-blur-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span className="text-2xl font-bold text-amber-500">{user.totalCuts}</span>
            </div>
            <p className="text-gray-500 text-xs">Cortes totales</p>
          </div>
        </div>
      </main>

      {showReminderToast && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50">
          <div className="bg-amber-500/15 border border-amber-400/40 rounded-2xl px-4 py-3 backdrop-blur-xl flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-amber-300 text-sm font-semibold">Recordatorio</p>
              <p className="text-amber-200 text-sm">Te faltan solo 2 cortes para tu corte GRATIS.</p>
            </div>
            <button
              onClick={() => setShowReminderToast(false)}
              className="text-amber-300 hover:text-amber-100 transition-colors"
              aria-label="Cerrar recordatorio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
