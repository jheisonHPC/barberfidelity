import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/users/[id] - Obtener datos del usuario y sus sellos
export async function GET(
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

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        business: {
          select: { 
            name: true, 
            slug: true 
          }
        },
        stampHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            createdAt: true
          }
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
    console.error('Error en GET /api/users/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
