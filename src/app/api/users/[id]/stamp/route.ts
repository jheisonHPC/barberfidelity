import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireBarberAuth } from '@/lib/auth'
import { validateSameOriginRequest } from '@/lib/security'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isStampCooldownEnabled() {
  return String(process.env.ENABLE_STAMP_COOLDOWN ?? 'false').toLowerCase() === 'true'
}

function getMinHoursBetweenStamps() {
  const parsed = Number(process.env.MIN_HOURS_BETWEEN_STAMPS ?? '12')
  if (!Number.isFinite(parsed) || parsed <= 0) return 12
  return parsed
}

// PATCH /api/users/[id]/stamp - Agregar 1 sello al cliente
export async function PATCH(
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

    if (isStampCooldownEnabled()) {
      const minHours = getMinHoursBetweenStamps()
      const minMs = minHours * 60 * 60 * 1000
      const lastPaidStamp = await prisma.stamp.findFirst({
        where: {
          userId: id,
          businessId: owner.businessId,
          type: 'PAID',
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      })

      if (lastPaidStamp) {
        const elapsedMs = Date.now() - lastPaidStamp.createdAt.getTime()
        if (elapsedMs < minMs) {
          const waitMs = minMs - elapsedMs
          const waitHours = Math.ceil(waitMs / (60 * 60 * 1000))
          return NextResponse.json(
            {
              error: `Aun no se puede agregar otro sello. Intenta en aproximadamente ${waitHours} hora(s).`,
            },
            { status: 429 }
          )
        }
      }
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

    if (user.stamps >= 5) {
      return NextResponse.json(
        {
          error: 'El cliente ya tiene 5 sellos. Debe canjear su corte gratis primero.',
          stamps: user.stamps,
          canRedeem: true
        },
        { status: 400 }
      )
    }

    const newStamps = user.stamps + 1
    const newTotalCuts = user.totalCuts + 1
    const justCompleted = newStamps === 5
    const cutsLeftForReward = Math.max(0, 5 - newStamps)
    const shouldRemindTwoCutsLeft = cutsLeftForReward === 2

    const [updatedUser, , , consumedToken] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          stamps: newStamps,
          totalCuts: newTotalCuts
        }
      }),
      prisma.stamp.create({
        data: {
          userId: id,
          businessId: user.businessId,
          type: 'PAID'
        }
      }),
      prisma.haircut.create({
        data: {
          userId: id,
          businessId: user.businessId,
          type: 'PAID',
          serviceName: 'Corte de cabello',
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
        stamps: updatedUser.stamps,
        totalCuts: updatedUser.totalCuts,
        canRedeem: updatedUser.stamps >= 5,
        scanToken: undefined
      },
      justCompleted,
      cutsLeftForReward,
      shouldRemindTwoCutsLeft,
      message: justCompleted
        ? 'Felicidades! El cliente completo 5 sellos y tiene 1 GRATIS disponible'
        : `Sello agregado. Faltan ${cutsLeftForReward} para el gratis.`
    })

  } catch (error) {
    console.error('Error en PATCH /api/users/[id]/stamp:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
