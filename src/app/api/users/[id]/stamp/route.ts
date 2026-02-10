import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/users/[id]/stamp - Agregar 1 sello al cliente
export async function PATCH(
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

    // Validar que no tenga ya 5 sellos
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

    // Calcular nuevos valores
    const newStamps = user.stamps + 1
    const newTotalCuts = user.totalCuts + 1
    const justCompleted = newStamps === 5

    // Actualizar usuario en transacción
    const [updatedUser, newStamp] = await prisma.$transaction([
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
      })
    ])

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        stamps: updatedUser.stamps,
        totalCuts: updatedUser.totalCuts,
        canRedeem: updatedUser.stamps >= 5
      },
      justCompleted,
      message: justCompleted 
        ? '🎉 ¡Felicidades! El cliente completó 5 sellos y tiene 1 GRATIS disponible'
        : `Sello agregado. Faltan ${5 - newStamps} para el gratis.`
    })

  } catch (error) {
    console.error('Error en PATCH /api/users/[id]/stamp:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
