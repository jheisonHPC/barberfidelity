'use client'

import { useState } from 'react'
import { QrScanner } from '@/components/QrScanner'
import { StampCard } from '@/components/StampCard'
import { Scissors, Gift, User, CheckCircle, AlertCircle, LogOut } from 'lucide-react'

interface UserData {
  id: string
  name: string
  phone: string
  stamps: number
  totalCuts: number
  canRedeem: boolean
  businessName: string
}

export default function BarberDashboard() {
  const [scannedUser, setScannedUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleScan = async (userId: string) => {
    // Stop scanning and fetch user data
    setLoading(true)
    setActionResult(null)

    try {
      const response = await fetch(`/api/stamps?userId=${userId}`)
      const data = await response.json()

      if (response.ok) {
        setScannedUser(data)
      } else {
        setActionResult({
          success: false,
          message: data.error || 'Error al obtener datos del cliente'
        })
      }
    } catch (error) {
      setActionResult({
        success: false,
        message: 'Error de conexión'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddStamp = async () => {
    if (!scannedUser) return

    setLoading(true)
    setActionResult(null)

    try {
      const response = await fetch('/api/stamps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: scannedUser.id,
          action: 'add'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setScannedUser(prev => prev ? {
          ...prev,
          stamps: data.stamps,
          totalCuts: data.totalCuts,
          canRedeem: data.canRedeem
        } : null)
        setActionResult({ success: true, message: data.message })
      } else {
        setActionResult({
          success: false,
          message: data.error || 'Error al agregar sello'
        })
      }
    } catch (error) {
      setActionResult({
        success: false,
        message: 'Error de conexión'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!scannedUser) return

    setLoading(true)
    setActionResult(null)

    try {
      const response = await fetch('/api/stamps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: scannedUser.id,
          action: 'redeem'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setScannedUser(prev => prev ? {
          ...prev,
          stamps: data.stamps,
          totalCuts: data.totalCuts,
          canRedeem: data.canRedeem
        } : null)
        setActionResult({ success: true, message: data.message })
      } else {
        setActionResult({
          success: false,
          message: data.error || 'Error al canjear'
        })
      }
    } catch (error) {
      setActionResult({
        success: false,
        message: 'Error de conexión'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetScan = () => {
    setScannedUser(null)
    setActionResult(null)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-gray-800">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <h1 className="text-white font-bold">Panel Barbero</h1>
              <p className="text-gray-500 text-xs">Sistema de Fidelización</p>
            </div>
          </div>
          <button className="text-gray-500 hover:text-gray-300 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {!scannedUser ? (
          <>
            <div className="text-center mb-6">
              <h2 className="text-white text-lg font-bold mb-2">
                Escanear QR del Cliente
              </h2>
              <p className="text-gray-500 text-sm">
                Apunta la cámara al código QR del cliente
              </p>
            </div>

            <QrScanner 
              onScan={handleScan} 
              className="max-w-sm mx-auto"
            />

            <div className="mt-8 bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <h3 className="text-gray-400 text-sm font-medium mb-3">
                Instrucciones:
              </h3>
              <ol className="text-gray-500 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="bg-gray-800 text-gray-400 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                  <span>Pide al cliente que abra su tarjeta de sellos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gray-800 text-gray-400 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                  <span>Escanea el QR que muestra en su pantalla</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gray-800 text-gray-400 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                  <span>Si tiene 5 sellos, canjea su corte gratis</span>
                </li>
              </ol>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={resetScan}
              className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
            >
              ← Escanear otro cliente
            </button>

            {/* User Info Card */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold">{scannedUser.name}</h3>
                  <p className="text-gray-500 text-sm">{scannedUser.phone}</p>
                </div>
              </div>

              {/* Stamp Card Preview */}
              <StampCard
                stamps={scannedUser.stamps}
                businessName={scannedUser.businessName}
                userName={scannedUser.name}
              />
            </div>

            {/* Action Buttons */}
            <div className="grid gap-3">
              {scannedUser.canRedeem ? (
                <button
                  onClick={handleRedeem}
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Gift className="w-5 h-5" />
                  {loading ? 'Procesando...' : 'CANJEAR CORTE GRATIS'}
                </button>
              ) : (
                <button
                  onClick={handleAddStamp}
                  disabled={loading || scannedUser.stamps >= 5}
                  className="w-full py-4 px-6 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-gray-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Scissors className="w-5 h-5" />
                  {loading ? 'Procesando...' : 'AGREGAR CORTE PAGADO'}
                </button>
              )}
            </div>

            {/* Action Result */}
            {actionResult && (
              <div className={`rounded-xl p-4 flex items-start gap-3 ${
                actionResult.success 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                {actionResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <p className={actionResult.success ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
                  {actionResult.message}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
                <p className="text-2xl font-bold text-white">{scannedUser.stamps}</p>
                <p className="text-gray-500 text-xs">Sellos actuales</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
                <p className="text-2xl font-bold text-amber-500">{scannedUser.totalCuts}</p>
                <p className="text-gray-500 text-xs">Cortes totales</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
