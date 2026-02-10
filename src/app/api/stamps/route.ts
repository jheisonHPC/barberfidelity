import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/stamps - Agregar sello o canjear gratis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Obtener el usuario con su negocio
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Acción: Agregar sello pagado
    if (action === 'add') {
      // Si ya tiene 5 sellos, no puede agregar más hasta canjear
      if (user.stamps >= 5) {
        return NextResponse.json(
          { 
            error: 'El cliente ya tiene 5 sellos. Debe canjear su corte gratis.',
            stamps: user.stamps,
            canRedeem: true
          },
          { status: 400 }
        )
      }

      const newStamps = user.stamps + 1
      const newTotalCuts = user.totalCuts + 1

      // Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          stamps: newStamps,
          totalCuts: newTotalCuts
        }
      })

      // Crear registro de sello
      await prisma.stamp.create({
        data: {
          userId,
          businessId: user.businessId,
          type: 'PAID'
        }
      })

      return NextResponse.json({
        success: true,
        stamps: updatedUser.stamps,
        totalCuts: updatedUser.totalCuts,
        canRedeem: updatedUser.stamps >= 5,
        message: newStamps === 5 
          ? '¡Felicidades! El cliente ha completado 5 cortes y tiene 1 GRATIS disponible' 
          : `Sello agregado. ${5 - newStamps} cortes más para el gratis.`
      })
    }

    // Acción: Canjear corte gratis
    if (action === 'redeem') {
      // Verificar que tenga 5 sellos para canjear
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

      // Actualizar usuario: resetear sellos y aumentar cortes totales
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          stamps: 0,
          totalCuts: user.totalCuts + 1
        }
      })

      // Crear registro de sello gratis
      await prisma.stamp.create({
        data: {
          userId,
          businessId: user.businessId,
          type: 'FREE'
        }
      })

      return NextResponse.json({
        success: true,
        stamps: 0,
        totalCuts: updatedUser.totalCuts,
        canRedeem: false,
        message: '¡Corte gratis canjeado exitosamente! El contador se ha reiniciado.'
      })
    }

    return NextResponse.json(
      { error: 'Acción no válida. Use "add" o "redeem"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error en /api/stamps:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET /api/stamps?userId=xxx - Obtener información de sellos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Se requiere userId' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stampHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        business: {
          select: { name: true, slug: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      stamps: user.stamps,
      totalCuts: user.totalCuts,
      canRedeem: user.stamps >= 5,
      businessName: user.business.name,
      businessSlug: user.business.slug,
      history: user.stampHistory
    })

  } catch (error) {
    console.error('Error en GET /api/stamps:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
