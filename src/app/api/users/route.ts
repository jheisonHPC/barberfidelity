import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/users - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, businessSlug } = body

    if (!name || !phone || !businessSlug) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de teléfono (10 dígitos)
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'El teléfono debe tener 10 dígitos' },
        { status: 400 }
      )
    }

    // Buscar o crear el negocio por slug (lazy-load)
    let business = await prisma.business.findUnique({
      where: { slug: businessSlug }
    })

    // Si no existe, crearlo automáticamente
    if (!business) {
      // Capitalizar el slug: "memphis-barberia" → "Memphis Barberia"
      const capitalizedName = businessSlug
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      business = await prisma.business.create({
        data: {
          name: `Barbería ${capitalizedName}`,
          slug: businessSlug
        }
      })
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: {
        phone_businessId: {
          phone,
          businessId: business.id
        }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'Ya existe una cuenta con este teléfono',
          user: {
            id: existingUser.id,
            name: existingUser.name,
            stamps: existingUser.stamps
          }
        },
        { status: 409 }
      )
    }

    // Crear nuevo usuario
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        businessId: business.id,
        stamps: 0,
        totalCuts: 0
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        stamps: user.stamps,
        totalCuts: user.totalCuts
      },
      message: 'Cuenta creada exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creando usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
