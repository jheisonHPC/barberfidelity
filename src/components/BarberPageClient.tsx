'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { StatePanel } from '@/components/ui/StatePanel'

interface UserData {
  id: string
  name: string
  phone: string
  stamps: number
  totalCuts: number
  canRedeem: boolean
  scanToken?: string
}

export default function BarberPageClient() {
  const router = useRouter()
  const [authChecking, setAuthChecking] = useState(true)
  const [scannedUser, setScannedUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(false)
  const { pushToast } = useToast()

  useEffect(() => {
    let cancelled = false

    const ensureSession = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()
        if (!data.session?.user?.email) {
          if (!cancelled) router.replace('/barber/login?next=/barber')
          return
        }
      } catch {
        if (!cancelled) router.replace('/barber/login?next=/barber')
        return
      }

      if (!cancelled) setAuthChecking(false)
    }

    void ensureSession()

    return () => {
      cancelled = true
    }
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/barber/login')
    router.refresh()
  }

  const handleScanSuccess = (user: UserData) => {
    setScannedUser(user)
  }

  const handleAddStamp = async () => {
    if (!scannedUser) return
    if (!scannedUser.scanToken) {
      pushToast({
        tone: 'error',
        title: 'QR no valido',
        detail: 'Escanea un QR vigente del cliente para continuar.',
      })
      return
    }

    setLoading(true)

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
        pushToast({
          tone: 'success',
          title: 'Sello agregado',
          detail: data.message,
        })

        if (data.justCompleted) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#c79a4e', '#4fb27a', '#ffffff'],
          })
        }
      } else {
        pushToast({
          tone: 'error',
          title: 'No se pudo agregar sello',
          detail: data.error,
        })
      }
    } catch {
      pushToast({
        tone: 'error',
        title: 'Error de conexion',
        detail: 'Verifica tu red e intenta nuevamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!scannedUser) return
    if (!scannedUser.scanToken) {
      pushToast({
        tone: 'error',
        title: 'QR no valido',
        detail: 'Escanea un QR vigente del cliente para continuar.',
      })
      return
    }

    setLoading(true)

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
        pushToast({
          tone: 'success',
          title: 'Canje completado',
          detail: data.message,
        })

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#4fb27a', '#89cf9f', '#ffffff'],
        })
      } else {
        pushToast({
          tone: 'error',
          title: 'No se pudo canjear',
          detail: data.error,
        })
      }
    } catch {
      pushToast({
        tone: 'error',
        title: 'Error de conexion',
        detail: 'Verifica tu red e intenta nuevamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  const resetScan = () => {
    setScannedUser(null)
  }

  if (authChecking) {
    return <StatePanel tone="loading" title="Validando sesion..." size="screen" />
  }

  return (
    <div className="min-h-screen bf-shell">
      <header className="relative z-10 border-b border-[var(--line-0)] bg-[#0f151ccc]/90 backdrop-blur-xl">
        <div className="bf-container-sm py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bf-panel flex items-center justify-center text-[#c79a4e]">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl leading-none tracking-wide">Panel Barbero</h1>
              <p className="text-[#a89f93] text-xs">Escaneo y validacion de clientes</p>
              <Breadcrumbs className="mt-1" items={[{ label: 'Barbero' }, { label: 'Escaner' }]} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/barber/dashboard"
              className="text-xs px-3 py-2 rounded-lg bf-btn-secondary bf-focus bf-interactive"
            >
              Dashboard
            </Link>
            <Link
              href="/barber/camera-test"
              className="text-xs px-3 py-2 rounded-lg bf-btn-secondary bf-focus bf-interactive"
            >
              Probar camara
            </Link>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bf-btn-secondary flex items-center justify-center bf-focus bf-interactive"
              aria-label="Cerrar sesion"
            >
              <LogOut className="w-5 h-5 text-[#cfc3b3]" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 bf-container-sm py-6">
        {!scannedUser ? (
          <>
            <div className="text-center mb-6">
              <h2 className="font-display text-4xl sm:text-5xl leading-none tracking-wide mb-2">Escanear cliente</h2>
              <p className="text-[#a89f93] text-sm">Apunta la camara al QR temporal del cliente</p>
            </div>

            <BarberScanner onScanSuccess={handleScanSuccess} />

            <div className="mt-6 bf-panel rounded-2xl p-4">
              <h3 className="text-[#d9cfbf] text-sm font-medium mb-3">Instrucciones:</h3>
              <ol className="text-[#a89f93] text-sm space-y-2">
                <li className="flex items-start gap-3">
                  <span className="bf-panel-soft text-[#d9cfbf] w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Pide al cliente abrir su tarjeta digital</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bf-panel-soft text-[#d9cfbf] w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Escanea su QR vigente</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bf-panel-soft text-[#d9cfbf] w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>Agrega sello o canjea su corte gratis</span>
                </li>
              </ol>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <button
              onClick={resetScan}
              className="text-sm flex items-center gap-2 bf-link-muted bf-interactive"
            >
              {'<-'} Escanear otro cliente
            </button>

            <div className="bf-panel rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#c79a4e1a] border border-[#c79a4e55] flex items-center justify-center">
                  <User className="w-7 h-7 text-[#c79a4e]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#f3eee7] font-bold text-lg truncate">{scannedUser.name}</h3>
                  <div className="flex items-center gap-2 text-[#a89f93] text-sm">
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
                      className={`aspect-square rounded-xl flex items-center justify-center border ${isStamped ? 'bg-[#c79a4e] border-[#c79a4e] text-[#12171d]' : 'bg-[#16212a] border-[var(--line-0)] text-[#6f665b]'}`}
                    >
                      {isStamped ? <Scissors className="w-5 h-5" /> : index + 1}
                    </div>
                  )
                })}

                <div
                  className={`aspect-square rounded-xl flex items-center justify-center border ${scannedUser.canRedeem ? 'bg-[#4fb27a] border-[#4fb27a] text-white' : 'bg-[#16212a] border-[var(--line-0)] text-[#6f665b]'}`}
                >
                  {scannedUser.canRedeem ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-[#b8ada0] text-sm">Progreso</span>
                <span className={`font-bold ${scannedUser.canRedeem ? 'text-[#89cf9f]' : 'text-[#e4c083]'}`}>
                  {scannedUser.stamps}/5
                </span>
              </div>
              <div className="h-2 bg-[#16212a] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${scannedUser.canRedeem ? 'bg-[#4fb27a]' : 'bg-[#c79a4e]'}`}
                  style={{ width: `${Math.min((scannedUser.stamps / 5) * 100, 100)}%` }}
                />
              </div>
            </div>

            {!scannedUser.canRedeem ? (
              <button
                onClick={handleAddStamp}
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl font-bold text-base bf-btn-primary bf-focus bf-interactive flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Scissors className="w-5 h-5" />
                {loading ? 'Procesando...' : 'Agregar sello (+1)'}
              </button>
            ) : (
              <button
                onClick={handleRedeem}
                disabled={loading}
                className="w-full py-5 px-6 rounded-2xl font-bold text-lg bf-btn-success bf-focus bf-interactive flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Gift className="w-6 h-6" />
                {loading ? 'Procesando...' : 'Canjear corte gratis'}
              </button>
            )}

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bf-panel bf-kpi-card text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-[#c79a4e]" />
                  <span className="text-2xl font-bold text-[#f3eee7]">{scannedUser.stamps}</span>
                </div>
                <p className="text-[#a89f93] text-xs">Sellos actuales</p>
              </div>
              <div className="bf-panel bf-kpi-card text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Scissors className="w-4 h-4 text-[#c79a4e]" />
                  <span className="text-2xl font-bold text-[#f0d8ad]">{scannedUser.totalCuts}</span>
                </div>
                <p className="text-[#a89f93] text-xs">Cortes totales</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
