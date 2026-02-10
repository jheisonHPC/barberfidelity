'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, AlertCircle, CheckCircle, X } from 'lucide-react'
import Link from 'next/link'

export default function CameraTestPage() {
  const [status, setStatus] = useState<string>('Haz clic en "Probar Cámara"')
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const testCamera = async () => {
    setStatus('Solicitando permisos...')
    setError(null)

    try {
      // Método simplificado - igual al scanner
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      })

      setStream(mediaStream)
      setStatus('Cámara activada ✅')

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }

    } catch (err: any) {
      console.error('Error:', err)
      setStatus('Error ❌')
      
      let errorMsg = err.message || String(err)
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Permiso denegado. Ve a Configuración > Privacidad > Cámara.'
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No se encontró cámara.'
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'Cámara ocupada. Cierra WhatsApp, Instagram, etc.'
      }
      
      setError(errorMsg)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStatus('Cámara detenida')
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="w-6 h-6 text-amber-500" />
            Test de Cámara
          </h1>
          <Link href="/barber" className="text-gray-400 hover:text-white text-sm">
            ← Volver
          </Link>
        </div>

        {/* Status */}
        <div className={`rounded-2xl p-4 border mb-4 ${
          status.includes('✅') ? 'bg-green-500/10 border-green-500/30 text-green-400' : 
          status.includes('❌') ? 'bg-red-500/10 border-red-500/30 text-red-400' : 
          'bg-gray-900/50 border-gray-800 text-gray-400'
        }`}>
          <p className="text-sm font-medium">{status}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Video */}
        <div className="bg-black rounded-2xl overflow-hidden mb-4 border border-gray-800">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-square object-cover"
          />
          {!stream && (
            <div className="aspect-square flex items-center justify-center">
              <p className="text-gray-600 text-sm">La cámara aparecerá aquí</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={testCamera}
            disabled={!!stream}
            className="flex-1 py-3 px-4 rounded-xl font-medium text-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 transition-all"
          >
            {stream ? 'Cámara activa' : 'Probar Cámara'}
          </button>
          {stream && (
            <button
              onClick={stopCamera}
              className="py-3 px-4 rounded-xl font-medium text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Soluciones */}
        <div className="space-y-3">
          <h3 className="text-gray-400 text-sm font-medium">Soluciones:</h3>
          
          <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800/50">
            <h4 className="text-white text-sm font-medium mb-2">iPhone (Safari)</h4>
            <ul className="text-gray-500 text-xs space-y-1 ml-4">
              <li>• Ajustes → Safari → Cámara → Permitir</li>
              <li>• Recarga la página después de cambiar permisos</li>
            </ul>
          </div>

          <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800/50">
            <h4 className="text-white text-sm font-medium mb-2">Si sigue sin funcionar</h4>
            <p className="text-gray-500 text-xs">
              Usa <strong className="text-amber-500">"Subir foto del QR"</strong> o <strong className="text-amber-500">"Ingresar ID manual"</strong> en el panel principal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
