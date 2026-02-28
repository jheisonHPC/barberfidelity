import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  isValidBusinessSlug,
  normalizePhone,
  sanitizeName,
  validateSameOriginRequest,
} from '@/lib/security'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/users - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const originError = validateSameOriginRequest(request)
    if (originError) return originError

    const body = await request.json()
    const name = sanitizeName(String(body?.name ?? ''))
    const phone = normalizePhone(String(body?.phone ?? ''))
    const businessSlug = String(body?.businessSlug ?? '').trim().toLowerCase()

    if (!name || !phone || !businessSlug) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    if (!isValidBusinessSlug(businessSlug)) {
      return NextResponse.json(
        { error: 'Slug de negocio invalido' },
        { status: 400 }
      )
    }

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { error: 'El nombre debe tener entre 2 y 80 caracteres' },
        { status: 400 }
      )
    }

    const phoneRegex = /^\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'El telefono debe tener 9 digitos' },
        { status: 400 }
      )
    }

    const business = await prisma.business.findUnique({
      where: { slug: businessSlug }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' },
        { status: 404 }
      )
    }

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
          error: 'Ya existe una cuenta con este telefono',
          user: {
            id: existingUser.id,
            name: existingUser.name,
            stamps: existingUser.stamps
          }
        },
        { status: 409 }
      )
    }

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
