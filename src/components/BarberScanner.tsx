'use client'

import { useState, useRef, useEffect } from 'react'
import jsQR from 'jsqr'
import { Camera, X, RefreshCw, Keyboard, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserData {
  id: string
  name: string
  phone: string
  stamps: number
  totalCuts: number
  canRedeem: boolean
  scanToken?: string
}

interface BarberScannerProps {
  onScanSuccess: (user: UserData) => void
  className?: string
}

export function BarberScanner({ onScanSuccess, className }: BarberScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualId, setManualId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const scannedRef = useRef(false)

  const parseError = (err: unknown) => {
    if (err instanceof Error) {
      return `${err.name}: ${err.message}`
    }
    return String(err)
  }

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    setIsLoading(true)
    setError(null)
    scannedRef.current = false

    try {
      // Mismo método que funciona en camera-test
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsScanning(true)
        startQRDetection()
      }
    } catch (err: unknown) {
      console.error('Error:', err)
      handleScanError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  const startQRDetection = () => {
    const detect = async () => {
      if (!videoRef.current || !canvasRef.current || scannedRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx || video.readyState !== 4) {
        animationRef.current = requestAnimationFrame(detect)
        return
      }

      // Ajustar canvas al tamaño del video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Dibujar frame actual
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Obtener datos de imagen
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // Intentar decodificar QR
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
      })

      if (code) {
        scannedRef.current = true
        stopScanning()
        
        // Resolver token QR temporal
        try {
          const response = await fetch('/api/scan/resolve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-requested-with': 'barber-fidelity',
            },
            body: JSON.stringify({ token: code.data }),
          })
          if (response.ok) {
            const userData = await response.json()
            onScanSuccess(userData)
          } else {
            const data = await response.json().catch(() => ({}))
            setError(data.error || 'QR invalido')
          }
        } catch {
          setError('Error al validar QR')
        }
        return
      }

      animationRef.current = requestAnimationFrame(detect)
    }

    detect()
  }

  const handleScanError = (err: unknown) => {
    const errorStr = parseError(err)
    
    if (errorStr.includes('NotAllowedError')) {
      setError('Permiso denegado. Ve a Configuración > Privacidad > Cámara.')
    } else if (errorStr.includes('NotFoundError')) {
      setError('No se encontró cámara.')
    } else if (errorStr.includes('NotReadableError')) {
      setError('Cámara ocupada. Cierra otras apps.')
    } else {
      setError('Error: ' + errorStr.substring(0, 100))
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualId.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${manualId.trim()}`)
      if (response.ok) {
        const userData = await response.json()
        userData.scanToken = undefined
        setManualId('')
        setShowManualInput(false)
        onScanSuccess(userData)
      } else {
        setError('Cliente no encontrado')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  // Escanear desde archivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      
      await new Promise((resolve) => { img.onload = resolve })
      
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        setError('Error procesando imagen')
        return
      }
      
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      
      if (code) {
        const response = await fetch('/api/scan/resolve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-requested-with': 'barber-fidelity',
          },
          body: JSON.stringify({ token: code.data }),
        })
        if (response.ok) {
          const userData = await response.json()
          onScanSuccess(userData)
        } else {
          const data = await response.json().catch(() => ({}))
          setError(data.error || 'QR invalido')
        }
      } else {
        setError('No se detectó QR en la imagen')
      }
    } catch {
      setError('Error al procesar imagen')
    } finally {
      setIsLoading(false)
    }
  }

  // Modo ingreso manual
  if (showManualInput) {
    return (
      <div className={cn("bg-gray-900/50 rounded-2xl p-6 border border-gray-800", className)}>
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-amber-500" />
          Ingreso Manual
        </h3>
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="ID del cliente"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 transition-all"
            >
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowManualInput(false)
                setManualId('')
                setError(null)
              }}
              className="py-3 px-4 rounded-xl font-medium text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all"
            >
              Volver
            </button>
          </div>
        </form>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {/* Scanner Container */}
      <div 
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 transition-all duration-300 bg-black",
          isScanning ? "border-amber-500/50" : "border-gray-800"
        )}
      >
        {/* Video Element - Mismo que camera-test */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn("w-full aspect-square object-cover", !isScanning && "hidden")}
        />

        {/* Canvas oculto para procesamiento */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Placeholder */}
        {!isScanning && (
          <div className="aspect-square flex flex-col items-center justify-center p-8 bg-gray-900/50">
            <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
              <Camera className="w-10 h-10 text-gray-500" />
            </div>
            <p className="text-gray-400 text-center text-sm">
              {error || 'Escanea el QR del cliente'}
            </p>
          </div>
        )}

        {/* Overlay de escaneo */}
        {isScanning && (
          <>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-amber-500" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-amber-500" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-amber-500" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-amber-500" />
            </div>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/50 animate-scan-line" />
            </div>
            <button
              onClick={stopScanning}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-gray-900/80 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-lg p-2 text-center">
              <p className="text-white text-xs">Apunta el QR al cuadro</p>
            </div>
          </>
        )}
      </div>

      {/* Botones */}
      {!isScanning && (
        <div className="space-y-3 mt-4">
          <button
            onClick={startScanning}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
            Escanear QR
          </button>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="qr-file"
          />
          <label
            htmlFor="qr-file"
            className="w-full py-3 px-6 rounded-xl font-medium text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Subir foto del QR
          </label>

          <button
            onClick={() => {
              setShowManualInput(true)
              setError(null)
            }}
            className="w-full py-3 px-6 rounded-xl font-medium text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all flex items-center justify-center gap-2"
          >
            <Keyboard className="w-4 h-4" />
            Ingresar ID manual
          </button>
        </div>
      )}

      {/* Error */}
      {error && !isScanning && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button
            onClick={() => {
              setError(null)
              startScanning()
            }}
            className="w-full py-2 px-4 rounded-lg font-medium text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 bg-gray-900/30 rounded-xl p-4 border border-gray-800/50">
        <p className="text-gray-500 text-xs">
          💡 Si la cámara no funciona, usa &quot;Subir foto del QR&quot; o ingresa el ID manualmente.
        </p>
      </div>
    </div>
  )
}
