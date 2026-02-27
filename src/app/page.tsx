import Link from 'next/link'
import { Scissors, QrCode, ShieldCheck } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-4">Barber Fidelity</h1>
          <p className="text-gray-400 max-w-2xl">
            Sistema de tarjeta de sellos digital para barberías.
            Cinco cortes pagados desbloquean un corte gratis.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
            <Scissors className="w-6 h-6 text-amber-400 mb-3" />
            <h2 className="font-semibold mb-1">Programa 5+1</h2>
            <p className="text-sm text-gray-400">Acumula sellos y canjea recompensas.</p>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
            <QrCode className="w-6 h-6 text-amber-400 mb-3" />
            <h2 className="font-semibold mb-1">QR por cliente</h2>
            <p className="text-sm text-gray-400">Escaneo rápido desde el panel de barbero.</p>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
            <ShieldCheck className="w-6 h-6 text-amber-400 mb-3" />
            <h2 className="font-semibold mb-1">Auth con Supabase</h2>
            <p className="text-sm text-gray-400">Rutas y APIs protegidas por sesión real.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/barberia-centro"
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold"
          >
            Registrar cliente
          </Link>
          <Link
            href="/barber/login"
            className="px-5 py-3 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-200 font-semibold"
          >
            Entrar al panel barbero
          </Link>
        </div>
      </main>
    </div>
  )
}
