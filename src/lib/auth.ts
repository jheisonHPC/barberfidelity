import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function requireBarberAuth() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user?.email) {
    return {
      user: null,
      owner: null,
      unauthorizedResponse: NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      ),
    }
  }

  const owner = await prisma.owner.findUnique({
    where: { email: data.user.email },
    select: {
      id: true,
      email: true,
      businessId: true,
      name: true,
    },
  })

  if (!owner) {
    return {
      user: null,
      owner: null,
      unauthorizedResponse: NextResponse.json(
        { error: 'Barbero no registrado para un negocio' },
        { status: 403 }
      ),
    }
  }

  return { user: data.user, owner, unauthorizedResponse: null }
}
