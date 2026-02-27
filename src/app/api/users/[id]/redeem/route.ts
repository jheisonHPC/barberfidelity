import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireBarberAuth } from '@/lib/auth'
import { validateSameOriginRequest } from '@/lib/security'

// POST /api/users/[id]/redeem - Canjear corte gratis
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scanTokenDelegate = (prisma as unknown as { scanToken?: {
      findUnique: typeof prisma.scanToken.findUnique
      updateMany: typeof prisma.scanToken.updateMany
    } }).scanToken
    if (!scanTokenDelegate) {
      return NextResponse.json(
        { error: 'Cliente Prisma desactualizado. Reinicia el servidor.' },
        { status: 503 }
      )
    }

    const originError = validateSameOriginRequest(_request)
    if (originError) return originError

    const auth = await requireBarberAuth()
    if (auth.unauthorizedResponse) {
      return auth.unauthorizedResponse
    }
    const owner = auth.owner

    const { id } = await params
    const body = await _request.json().catch(() => ({}))
    const scanTokenValue = String(body?.scanToken ?? '').trim()

    if (!id || !scanTokenValue) {
      return NextResponse.json(
        { error: 'Se requiere ID de usuario y QR vigente' },
        { status: 400 }
      )
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id },
      include: { business: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    if (!owner || user.businessId !== owner.businessId) {
      return NextResponse.json(
        { error: 'No autorizado para operar este cliente' },
        { status: 403 }
      )
    }

    const scanToken = await scanTokenDelegate.findUnique({
      where: { token: scanTokenValue }
    })

    if (
      !scanToken
      || scanToken.userId !== id
      || scanToken.businessId !== owner.businessId
      || scanToken.usedAt
      || scanToken.expiresAt <= new Date()
    ) {
      return NextResponse.json(
        { error: 'QR invalido o expirado. Escanea nuevamente.' },
        { status: 400 }
      )
    }

    // Validar que tenga exactamente 5 sellos
    if (user.stamps < 5) {
      return NextResponse.json(
        { 
          error: `El cliente solo tiene ${user.stamps} sellos. Necesita 5 para canjear.`,
          stamps: user.stamps,
          canRedeem: false
        },
        { status: 400 }
      )
    }

    // Calcular nuevos valores
    const newTotalCuts = user.totalCuts + 1

    // Actualizar usuario: resetear sellos a 0, incrementar cortes totales
    const [updatedUser, , consumedToken] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          stamps: 0,
          totalCuts: newTotalCuts
        }
      }),
      prisma.stamp.create({
        data: {
          userId: id,
          businessId: user.businessId,
          type: 'FREE'
        }
      }),
      scanTokenDelegate.updateMany({
        where: {
          token: scanTokenValue,
          usedAt: null
        },
        data: { usedAt: new Date() }
      })
    ])

    if (consumedToken.count !== 1) {
      return NextResponse.json(
        { error: 'QR invalido o ya utilizado. Escanea nuevamente.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        stamps: 0,
        totalCuts: updatedUser.totalCuts,
        canRedeem: false,
        scanToken: undefined
      },
      message: '✅ Corte gratis canjeado exitosamente. El contador se ha reiniciado a 0/5.'
    })

  } catch (error) {
    console.error('Error en POST /api/users/[id]/redeem:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
