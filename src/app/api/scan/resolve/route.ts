import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireBarberAuth } from '@/lib/auth'
import { validateSameOriginRequest } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const scanTokenDelegate = (prisma as unknown as { scanToken?: {
      findUnique: typeof prisma.scanToken.findUnique
    } }).scanToken
    if (!scanTokenDelegate) {
      return NextResponse.json(
        { error: 'Cliente Prisma desactualizado. Reinicia el servidor.' },
        { status: 503 }
      )
    }

    const originError = validateSameOriginRequest(request)
    if (originError) return originError

    const auth = await requireBarberAuth()
    if (auth.unauthorizedResponse) {
      return auth.unauthorizedResponse
    }

    const token = String((await request.json().catch(() => ({})))?.token ?? '').trim()
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
    }

    const scanToken = await scanTokenDelegate.findUnique({
      where: { token },
      include: {
        user: true
      }
    })

    if (!scanToken || scanToken.businessId !== auth.owner?.businessId) {
      return NextResponse.json({ error: 'QR invalido' }, { status: 404 })
    }

    if (scanToken.usedAt) {
      return NextResponse.json({ error: 'QR ya utilizado. Pide uno nuevo.' }, { status: 400 })
    }

    if (scanToken.expiresAt <= new Date()) {
      return NextResponse.json({ error: 'QR expirado. Pide uno nuevo.' }, { status: 400 })
    }

    const user = scanToken.user

    return NextResponse.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      stamps: user.stamps,
      totalCuts: user.totalCuts,
      canRedeem: user.stamps >= 5,
      scanToken: scanToken.token
    })
  } catch (error) {
    console.error('Error resolviendo token QR:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
