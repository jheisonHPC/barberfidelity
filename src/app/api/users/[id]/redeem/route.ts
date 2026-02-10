import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/users/[id]/redeem - Canjear corte gratis
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere ID de usuario' },
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
    const [updatedUser, redeemedStamp] = await prisma.$transaction([
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
      })
    ])

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        stamps: 0,
        totalCuts: updatedUser.totalCuts,
        canRedeem: false
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
