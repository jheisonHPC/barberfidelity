'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { Scissors, Gift, Lock, Unlock, Crown, User, Calendar, Award, ShoppingBag } from 'lucide-react'
import { StatePanel } from '@/components/ui/StatePanel'
import { useToast } from '@/components/ui/ToastProvider'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

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

interface HaircutItem {
  id: string
  type: 'PAID' | 'FREE'
  serviceName: string
  priceCents: number | null
  createdAt: string
}

function getReminderStorageKey(userId: string) {
  const today = new Date().toISOString().slice(0, 10)
  return `two-cuts-reminder:${userId}:${today}`
}

function formatHaircutDate(isoDate: string) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate))
}

function formatPrice(priceCents: number | null) {
  if (priceCents === null || priceCents < 0) return 'No registrado'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(priceCents / 100)
}

export default function DigitalCardPage() {
  const params = useParams()
  const { businessSlug, userId } = params as { businessSlug: string; userId: string }

  const [user, setUser] = useState<UserData | null>(null)
  const [qrToken, setQrToken] = useState<QrTokenData | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [haircuts, setHaircuts] = useState<HaircutItem[]>([])
  const [loadingHaircuts, setLoadingHaircuts] = useState(true)
  const { pushToast } = useToast()

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
      return
    }

    const storageKey = getReminderStorageKey(user.id)
    const alreadyShownToday = window.localStorage.getItem(storageKey) === '1'
    if (!alreadyShownToday) {
      pushToast({
        tone: 'info',
        title: 'Recordatorio',
        detail: 'Te faltan solo 2 cortes para tu corte GRATIS.',
        durationMs: 5500,
      })
      window.localStorage.setItem(storageKey, '1')
    }
  }, [pushToast, user])

  useEffect(() => {
    const fetchHaircuts = async () => {
      try {
        const response = await fetch(
          `/api/users/${userId}/haircuts?businessSlug=${encodeURIComponent(businessSlug)}&limit=6`
        )
        if (!response.ok) {
          throw new Error('No se pudo cargar historial')
        }
        const data = await response.json()
        setHaircuts(Array.isArray(data.items) ? data.items : [])
      } catch {
        setHaircuts([])
      } finally {
        setLoadingHaircuts(false)
      }
    }

    if (userId && businessSlug) {
      setLoadingHaircuts(true)
      void fetchHaircuts()
    }
  }, [businessSlug, userId])

  if (loading) {
    return <StatePanel tone="loading" title="Cargando tu tarjeta..." size="screen" />
  }

  if (error || !user) {
    return (
      <StatePanel
        tone="error"
        title="No se pudo cargar tu tarjeta"
        detail={error || 'Usuario no encontrado'}
        size="screen"
      />
    )
  }

  const filledStamps = user.stamps

  return (
    <div className="min-h-screen bf-shell">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-[var(--line-0)] bg-[#0f151ccc]/90 backdrop-blur-xl">
        <div className="bf-container-sm py-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bf-panel flex items-center justify-center text-[#c79a4e]">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl leading-none tracking-wide text-[#f3eee7]">{user.businessName}</h1>
              <p className="text-[#a89f93] text-xs">Miembro del Club</p>
              <Breadcrumbs className="mt-1" items={[{ label: 'Cliente' }, { label: 'Tarjeta' }]} />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 bf-container-sm py-7 sm:py-8">
        <div className="text-center mb-8">
          <h2 className="font-display text-4xl sm:text-5xl leading-none tracking-wide text-[#f3eee7] mb-3">Hola, {user.name.split(' ')[0]}!</h2>
          <p className="text-[#b8ada0] text-sm">
            {user.canRedeem
              ? 'Tienes un corte GRATIS disponible!'
              : `Acumula ${5 - filledStamps} sello${5 - filledStamps !== 1 ? 's' : ''} mas para tu recompensa`}
          </p>
        </div>

        <div className="relative mb-8">
          <div className="relative bf-panel rounded-3xl p-5 sm:p-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#c79a4e14] via-transparent to-transparent pointer-events-none" />

            <div className="relative flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#c79a4e1a] border border-[#c79a4e55] flex items-center justify-center">
                  <User className="w-6 h-6 text-[#c79a4e]" />
                </div>
                <div>
                  <h3 className="text-[#f3eee7] font-semibold">{user.name}</h3>
                  <p className="text-[#a89f93] text-xs">{user.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-[#c79a4e]">
                  <Award className="w-4 h-4" />
                  <span className="font-bold">{user.totalCuts}</span>
                </div>
                <p className="text-[#8b8175] text-xs">Cortes</p>
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
                        ? 'bg-[#c79a4e] text-[#12171d]'
                        : 'bg-[#16212a] border-2 border-dashed border-[var(--line-0)] text-[#746a5f]'
                      }
                    `}
                  >
                    {isStamped ? (
                      <Scissors className="w-8 h-8 text-gray-950" />
                    ) : (
                      <span className="font-bold text-lg">{index + 1}</span>
                    )}
                  </div>
                )
              })}

              <div
                className={`
                  aspect-square rounded-2xl flex items-center justify-center transition-all duration-500
                  ${user.canRedeem
                    ? 'bg-[#4fb27a] border-2 border-[#4fb27a]'
                    : 'bg-[#16212a] border-2 border-dashed border-[var(--line-0)] text-[#746a5f]'
                  }
                `}
              >
                {user.canRedeem ? (
                  <div className="flex flex-col items-center">
                    <Unlock className="w-6 h-6 text-[#f3eee7] mb-1" />
                    <span className="text-[#f3eee7] text-[11px] font-bold tracking-wide">GRATIS</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Lock className="w-6 h-6 text-[#746a5f] mb-1" />
                    <Gift className="w-5 h-5 text-[#746a5f]" />
                  </div>
                )}
              </div>
            </div>

            <div className="relative mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#b8ada0] text-xs">Progreso</span>
                <span className={user.canRedeem ? 'text-[#89cf9f] font-bold' : 'text-[#c79a4e] font-bold'}>
                  {Math.min(filledStamps, 5)}/5
                </span>
              </div>
              <div className="h-2 bg-[#16212a] rounded-full overflow-hidden">
                <div
                  className={`
                    h-full rounded-full transition-all duration-700 ease-out
                    ${user.canRedeem ? 'bg-[#4fb27a]' : 'bg-[#c79a4e]'}
                  `}
                  style={{ width: `${Math.min((filledStamps / 5) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative bf-panel rounded-3xl p-5 sm:p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#c79a4e1a] border border-[#c79a4e55] flex items-center justify-center">
              <Scissors className="w-5 h-5 text-[#c79a4e]" />
            </div>
            <div>
              <h3 className="text-[#f3eee7] font-semibold">Tu Codigo QR</h3>
              <p className="text-[#a89f93] text-xs">Muestralo al barbero</p>
            </div>
          </div>

          <div className="flex justify-center py-4">
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl">
              <QRCodeSVG
                value={qrToken?.token || ''}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          <p className="text-[#a89f93] text-xs text-center">
            Este codigo es temporal y se renueva automaticamente
          </p>
          <p className="text-[#e4c083] text-xs text-center mt-1 font-data">
            Expira en {secondsLeft}s
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bf-panel bf-kpi-card text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Scissors className="w-4 h-4 text-[#c79a4e]" />
              <span className="text-2xl font-bold text-[#f3eee7]">{filledStamps}</span>
            </div>
            <p className="text-[#a89f93] text-xs">Sellos actuales</p>
          </div>
          <div className="bf-panel bf-kpi-card text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-[#c79a4e]" />
              <span className="text-2xl font-bold text-[#c79a4e]">{user.totalCuts}</span>
            </div>
            <p className="text-[#a89f93] text-xs">Cortes totales</p>
          </div>
        </div>

        <div className="mt-6 bf-panel rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#f3eee7] font-semibold">Historial de cortes</h3>
            <span className="text-[#a89f93] text-xs">Ultimos {haircuts.length}</span>
          </div>

          {loadingHaircuts ? (
            <StatePanel
              tone="loading"
              title="Cargando historial..."
              className="rounded-xl p-4"
            />
          ) : haircuts.length === 0 ? (
            <StatePanel
              tone="empty"
              title="Aun no tienes cortes registrados"
              detail="Tu historial aparecera aqui despues de tu primera visita."
              className="rounded-xl p-4"
            />
          ) : (
            <div className="space-y-2">
              {haircuts.map((haircut) => (
                <div
                  key={haircut.id}
                  className="rounded-xl border border-[var(--line-0)] bg-[#10171fcc] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-[#f3eee7] font-medium">{haircut.serviceName}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        haircut.type === 'FREE'
                          ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                          : 'text-amber-300 border-amber-500/40 bg-amber-500/10'
                      }`}
                    >
                      {haircut.type === 'FREE' ? 'Gratis' : 'Pagado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-[#a89f93]">{formatHaircutDate(haircut.createdAt)}</p>
                    <p className="text-xs text-[#b8ada0]">{formatPrice(haircut.priceCents)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bf-panel rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#c79a4e1a] border border-[#c79a4e55] flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-[#c79a4e]" />
                </div>
                <div>
                  <h3 className="text-[#f3eee7] font-semibold">Catalogo de cortes</h3>
                  <p className="text-[#a89f93] text-xs">Taper fade, mod cut y mas</p>
                </div>
              </div>
              <Link
                href={`/${businessSlug}/card/${userId}/haircut-styles`}
                className="text-xs px-3 py-2 rounded-lg bf-btn-primary bf-focus bf-interactive font-semibold"
              >
                Abrir
              </Link>
            </div>
          </div>

          <div className="bf-panel rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#c79a4e1a] border border-[#c79a4e55] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-[#c79a4e]" />
                </div>
                <div>
                  <h3 className="text-[#f3eee7] font-semibold">Catalogo de productos</h3>
                  <p className="text-[#a89f93] text-xs">Ver imagenes, precios y stock</p>
                </div>
              </div>
              <Link
                href={`/${businessSlug}/card/${userId}/products`}
                className="text-xs px-3 py-2 rounded-lg bf-btn-primary bf-focus bf-interactive font-semibold"
              >
                Abrir
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
