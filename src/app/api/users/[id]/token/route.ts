import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidBusinessSlug, validateSameOriginRequest } from '@/lib/security'

const DEFAULT_TOKEN_TTL_SECONDS = 180
const MIN_TOKEN_TTL_SECONDS = 60
const MAX_TOKEN_TTL_SECONDS = 600

function getTokenTtlSeconds() {
  const raw = Number(process.env.QR_TOKEN_TTL_SECONDS)
  if (!Number.isFinite(raw)) return DEFAULT_TOKEN_TTL_SECONDS
  return Math.min(MAX_TOKEN_TTL_SECONDS, Math.max(MIN_TOKEN_TTL_SECONDS, Math.floor(raw)))
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scanTokenDelegate = (prisma as unknown as { scanToken?: {
      deleteMany: typeof prisma.scanToken.deleteMany
      create: typeof prisma.scanToken.create
    } }).scanToken
    if (!scanTokenDelegate) {
      return NextResponse.json(
        { error: 'Cliente Prisma desactualizado. Reinicia el servidor.' },
        { status: 503 }
      )
    }

    const originError = validateSameOriginRequest(request)
    if (originError) return originError

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const businessSlug = String(body?.businessSlug ?? '').trim().toLowerCase()

    if (!id || !businessSlug) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    if (!isValidBusinessSlug(businessSlug)) {
      return NextResponse.json({ error: 'businessSlug invalido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { business: { select: { id: true, slug: true } } }
    })

    if (!user || user.business.slug !== businessSlug) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const tokenTtlSeconds = getTokenTtlSeconds()
    const expiresAt = new Date(Date.now() + tokenTtlSeconds * 1000)
    const token = randomBytes(24).toString('base64url')

    // Keep token table lean by removing stale rows for this user.
    await scanTokenDelegate.deleteMany({
      where: {
        userId: user.id,
        OR: [{ usedAt: { not: null } }, { expiresAt: { lt: new Date() } }]
      }
    })

    const scanToken = await scanTokenDelegate.create({
      data: {
        token,
        userId: user.id,
        businessId: user.businessId,
        expiresAt
      }
    })

    return NextResponse.json({
      token: scanToken.token,
      expiresAt: scanToken.expiresAt.toISOString()
    })
  } catch (error) {
    console.error('Error generando token QR:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
