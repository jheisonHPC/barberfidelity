'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Scissors, Gift, Lock, Unlock, Crown, User, Calendar, Award } from 'lucide-react'

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

export default function DigitalCardPage() {
  const params = useParams()
  const { businessSlug, userId } = params as { businessSlug: string; userId: string }
  
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`)
        
        if (!response.ok) {
          throw new Error('Usuario no encontrado')
        }
        
        const data = await response.json()
        setUser(data)
      } catch (err) {
        setError('No se pudo cargar la información del usuario')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUserData()
    }
  }, [userId])

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

  const totalSlots = 6
  const filledStamps = user.stamps

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
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

      {/* Main Content */}
      <main className="relative max-w-md mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            ¡Hola, {user.name.split(' ')[0]}!
          </h2>
          <p className="text-gray-400 text-sm">
            {user.canRedeem 
              ? '🎉 ¡Tienes un corte GRATIS disponible!' 
              : `Acumula ${5 - filledStamps} sello${5 - filledStamps !== 1 ? 's' : ''} más para tu recompensa`}
          </p>
        </div>

        {/* Digital Card */}
        <div className="relative mb-8">
          {/* Card Glassmorphism Container */}
          <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-950/90 rounded-3xl p-6 border border-gray-800/50 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />
            
            {/* Card Header */}
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

            {/* Stamps Grid */}
            <div className="relative grid grid-cols-3 gap-3 mb-6">
              {/* First 5 slots - Paid stamps */}
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

              {/* 6th slot - Free cut */}
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

            {/* Progress Bar */}
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

            {/* Status Message */}
            <div className={`
              rounded-xl p-3 text-center
              ${user.canRedeem 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-gray-800/50 border border-gray-700/50'
              }
            `}>
              <p className={user.canRedeem ? 'text-green-400 text-sm font-medium' : 'text-gray-400 text-sm'}>
                {user.canRedeem 
                  ? '🎉 ¡Muestra esta pantalla al barbero para canjear tu corte gratis!' 
                  : `Completa ${5 - filledStamps} visita${5 - filledStamps !== 1 ? 's' : ''} más para desbloquear`}
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-950/80 rounded-3xl p-6 border border-gray-800/50 backdrop-blur-xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-white font-bold">Tu Código QR</h3>
              <p className="text-gray-500 text-xs">Muestra esto al barbero</p>
            </div>
          </div>

          <div className="flex justify-center py-4">
            <div className="bg-white p-4 rounded-2xl shadow-xl">
              <QRCodeSVG 
                value={user.id}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          <p className="text-gray-500 text-xs text-center">
            Este código es único e intransferible
          </p>
        </div>

        {/* Stats Grid */}
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

        {/* PWA Install Hint */}
        <div className="mt-8 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
          <p className="text-amber-400/80 text-xs text-center">
            💡 <strong>Tip:</strong> Agrega esta página a tu pantalla de inicio para acceso rápido desde tu teléfono
          </p>
        </div>
      </main>
    </div>
  )
}
