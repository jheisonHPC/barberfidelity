import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...\n')

  // 1. Crear Business Demo
  const business = await prisma.business.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      name: 'Barbería Demo',
    }
  })
  console.log('✅ Business creada:', business.name, `(slug: ${business.slug})`)

  // 2. Crear Owner (para futura autenticación)
  const owner = await prisma.owner.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: 'admin123', // En producción usar bcrypt
      name: 'Admin Demo',
      businessId: business.id
    }
  })
  console.log('✅ Owner creado:', owner.name)

  // 3. Crear User de prueba con 3 sellos
  const testUser = await prisma.user.upsert({
    where: { 
      phone_businessId: {
        phone: '+56999999999',
        businessId: business.id
      }
    },
    update: {},
    create: {
      name: 'Cliente Test',
      phone: '+56999999999',
      stamps: 3,
      totalCuts: 3,
      businessId: business.id
    }
  })
  console.log('✅ User creado:', testUser.name, `(stamps: ${testUser.stamps})`)

  // 4. Crear stamps para el usuario de prueba
  const existingStamps = await prisma.stamp.count({
    where: { userId: testUser.id }
  })

  if (existingStamps === 0) {
    await prisma.stamp.createMany({
      data: [
        { userId: testUser.id, businessId: business.id, type: 'PAID' },
        { userId: testUser.id, businessId: business.id, type: 'PAID' },
        { userId: testUser.id, businessId: business.id, type: 'PAID' },
      ]
    })
    console.log('✅ 3 stamps creados para el usuario de prueba')
  }

  // 5. Crear usuario listo para canjear (5 sellos)
  const redeemUser = await prisma.user.upsert({
    where: { 
      phone_businessId: {
        phone: '+56988888888',
        businessId: business.id
      }
    },
    update: {},
    create: {
      name: 'Cliente Listo',
      phone: '+56988888888',
      stamps: 5,
      totalCuts: 7,
      businessId: business.id
    }
  })
  console.log('✅ User creado:', redeemUser.name, `(stamps: ${redeemUser.stamps}, listo para canjear)`)

  // 6. Crear stamps para el usuario listo
  const existingRedeemStamps = await prisma.stamp.count({
    where: { userId: redeemUser.id }
  })

  if (existingRedeemStamps === 0) {
    await prisma.stamp.createMany({
      data: Array(5).fill(null).map(() => ({
        userId: redeemUser.id,
        businessId: business.id,
        type: 'PAID'
      }))
    })
    console.log('✅ 5 stamps creados para el usuario listo')
  }

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\n📱 URLs de prueba:')
  console.log(`  • Cliente (3 sellos): http://localhost:3000/demo/card/${testUser.id}`)
  console.log(`  • Cliente (5 sellos): http://localhost:3000/demo/card/${redeemUser.id}`)
  console.log('  • Panel Barbero: http://localhost:3000/barber')
  console.log('\n🔑 Password barbero: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
