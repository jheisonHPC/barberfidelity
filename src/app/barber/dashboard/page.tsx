import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  Gift,
  Scissors,
  UserRound,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type PeriodKey = 'today' | '7d' | '30d'

const PERIOD_OPTIONS: Array<{ key: PeriodKey; label: string; days: number }> = [
  { key: 'today', label: 'Hoy', days: 1 },
  { key: '7d', label: '7 dias', days: 7 },
  { key: '30d', label: '30 dias', days: 30 },
]
const STANDARD_HAIRCUT_PRICE_CENTS = 2500

const DATE_FORMATTER = new Intl.DateTimeFormat('es-DO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatDate(value: Date) {
  return DATE_FORMATTER.format(value)
}

function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`
}

function formatPenFromCents(valueCents: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 2,
  }).format(valueCents / 100)
}

function countByType(
  items: Array<{ type: 'PAID' | 'FREE' }>
) {
  let paid = 0
  let free = 0
  for (const item of items) {
    if (item.type === 'PAID') paid += 1
    if (item.type === 'FREE') free += 1
  }
  return { paid, free }
}

function toDayKey(value: Date) {
  return value.toISOString().slice(0, 10)
}

function buildDaySeries(start: Date, end: Date) {
  const days: Array<{ key: string; label: string }> = []
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  const finish = new Date(end)
  finish.setHours(0, 0, 0, 0)

  const shortDay = new Intl.DateTimeFormat('es-DO', { weekday: 'short' })

  while (cursor <= finish) {
    days.push({
      key: toDayKey(cursor),
      label: shortDay.format(cursor).replace('.', '').slice(0, 3),
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

function getSelectedPeriodKey(
  raw: string | string[] | undefined
): PeriodKey {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value === 'today' || value === '30d') return value
  return '7d'
}

function getPeriodStart(days: number) {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  return start
}

export default async function BarberDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const selectedPeriodKey = getSelectedPeriodKey(resolvedSearchParams?.period)
  const selectedPeriod = PERIOD_OPTIONS.find((option) => option.key === selectedPeriodKey) ?? PERIOD_OPTIONS[1]
  const periodStart = getPeriodStart(selectedPeriod.days)

  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const userEmail = data.user?.email

  if (!userEmail) {
    redirect('/barber/login?next=/barber/dashboard')
  }

  const owner = await prisma.owner.findUnique({
    where: { email: userEmail },
    select: {
      businessId: true,
      business: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  })

  if (!owner) {
    redirect('/barber/login')
  }

  const businessId = owner.businessId
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const totalUsers = await prisma.user.count({ where: { businessId } })
  const usersLast7Days = await prisma.user.count({ where: { businessId, createdAt: { gte: sevenDaysAgo } } })
  const usersLast30Days = await prisma.user.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } })
  const periodNewUsers = await prisma.user.count({
    where: {
      businessId,
      createdAt: { gte: periodStart },
    },
  })

  const allHaircutTypes = await prisma.haircut.findMany({
    where: { businessId },
    select: { type: true },
  })

  const last30Haircuts = await prisma.haircut.findMany({
    where: {
      businessId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { type: true },
  })

  const periodUsersCreated = await prisma.user.findMany({
    where: {
      businessId,
      createdAt: { gte: periodStart },
    },
    select: { createdAt: true },
  })

  const paidHaircutsInPeriod = await prisma.haircut.findMany({
    where: {
      businessId,
      createdAt: { gte: periodStart },
    },
    select: {
      type: true,
      createdAt: true,
      userId: true,
      priceCents: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  })
  const recentUsers = await prisma.user.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
      stamps: true,
      totalCuts: true,
    },
  })
  const topUsers = await prisma.user.findMany({
    where: { businessId },
    orderBy: [{ totalCuts: 'desc' }, { updatedAt: 'desc' }],
    take: 5,
    select: {
      id: true,
      name: true,
      totalCuts: true,
      stamps: true,
    },
  })

  const totalByType = countByType(allHaircutTypes)
  const totalHaircuts = totalByType.paid + totalByType.free
  const totalFreeHaircuts = totalByType.free

  const last30ByType = countByType(last30Haircuts)
  const paidHaircutsLast30Days = last30ByType.paid
  const freeHaircutsLast30Days = last30ByType.free
  const totalHaircutsLast30Days = paidHaircutsLast30Days + freeHaircutsLast30Days

  const periodHaircutsCreated = paidHaircutsInPeriod.map((item) => ({
    createdAt: item.createdAt,
  }))
  const periodByType = countByType(
    paidHaircutsInPeriod.map((item) => ({ type: item.type }))
  )
  const periodPaidHaircuts = periodByType.paid
  const periodFreeHaircuts = periodByType.free
  const periodTotalHaircuts = periodPaidHaircuts + periodFreeHaircuts
  const periodFreeShare = periodTotalHaircuts > 0
    ? (periodFreeHaircuts / periodTotalHaircuts) * 100
    : 0
  const freeShare = totalHaircuts > 0 ? (totalFreeHaircuts / totalHaircuts) * 100 : 0
  const freeShare30d = totalHaircutsLast30Days > 0
    ? (freeHaircutsLast30Days / totalHaircutsLast30Days) * 100
    : 0

  const usersByDay = new Map<string, number>()
  for (const user of periodUsersCreated) {
    const dayKey = toDayKey(user.createdAt)
    usersByDay.set(dayKey, (usersByDay.get(dayKey) ?? 0) + 1)
  }

  const haircutsByDay = new Map<string, number>()
  for (const haircut of periodHaircutsCreated) {
    const dayKey = toDayKey(haircut.createdAt)
    haircutsByDay.set(dayKey, (haircutsByDay.get(dayKey) ?? 0) + 1)
  }

  const daySeries = buildDaySeries(periodStart, now)
  const activitySeries = daySeries.map((day) => ({
    ...day,
    users: usersByDay.get(day.key) ?? 0,
    haircuts: haircutsByDay.get(day.key) ?? 0,
  }))
  const peakActivity = Math.max(
    1,
    ...activitySeries.map((item) => Math.max(item.users, item.haircuts))
  )
  const paidByUser = new Map<string, { paidCuts: number; paidCents: number }>()
  let periodPaidRevenueCents = 0

  for (const paidHaircut of paidHaircutsInPeriod) {
    if (paidHaircut.type !== 'PAID') continue
    const paidAmount = paidHaircut.priceCents ?? STANDARD_HAIRCUT_PRICE_CENTS
    periodPaidRevenueCents += paidAmount
    const previous = paidByUser.get(paidHaircut.userId) ?? { paidCuts: 0, paidCents: 0 }
    paidByUser.set(paidHaircut.userId, {
      paidCuts: previous.paidCuts + 1,
      paidCents: previous.paidCents + paidAmount,
    })
  }

  const paidUsersIndex = new Map(
    paidHaircutsInPeriod
      .filter((item) => item.type === 'PAID' && item.user)
      .map((item) => [item.userId, item.user as { id: string; name: string; phone: string }])
  )
  const paidUserIds = [...paidByUser.keys()]
  const periodClientPayments = paidUserIds
    .map((userId) => {
      const user = paidUsersIndex.get(userId)
      const paidData = paidByUser.get(userId)
      if (!user || !paidData) return null
      return {
        ...user,
        paidCuts: paidData.paidCuts,
        paidCents: paidData.paidCents,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.paidCents - a.paidCents)
    .slice(0, 10)

  return (
    <div className="min-h-screen bf-shell">
      <header className="relative z-10 border-b border-[var(--line-0)] bg-[#0f151ccc]/90 backdrop-blur-xl">
        <div className="bf-container py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-3xl sm:text-4xl leading-none tracking-wide">Dashboard</h1>
            <p className="text-[#a89f93] text-xs truncate">{owner.business.name}</p>
            <Breadcrumbs
              className="mt-1"
              items={[
                { label: 'Barbero', href: '/barber' },
                { label: 'Dashboard' },
              ]}
            />
          </div>
          <Link
            href="/barber"
            className="px-3 py-2 rounded-xl text-xs bf-btn-secondary bf-focus bf-interactive inline-flex items-center gap-1"
          >
            Ir a escaner
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 bf-container py-6 space-y-5">
        <section className="bf-panel rounded-3xl p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#8f8578]">Resumen de periodo</p>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#f3eee7]">
                {selectedPeriod.label}
              </h2>
            </div>
            <div className="rounded-2xl border border-[var(--line-0)] bg-[#101820cc] p-1 inline-flex gap-1">
              {PERIOD_OPTIONS.map((option) => {
                const isActive = option.key === selectedPeriodKey
                return (
                  <Link
                    key={option.key}
                    href={`/barber/dashboard?period=${option.key}`}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium bf-focus bf-interactive ${
                      isActive
                        ? 'bg-[#c79a4e] text-[#111820]'
                        : 'text-[#cfc3b3] hover:bg-[#16212acc]'
                    }`}
                  >
                    {option.label}
                  </Link>
                )
              })}
            </div>
            <Link
              href={`/api/barber/dashboard/payments-csv?period=${selectedPeriodKey}`}
              className="px-3 py-2 rounded-xl text-xs bf-btn-secondary bf-focus bf-interactive"
            >
              Exportar CSV
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <article className="rounded-2xl border border-[var(--line-0)] bg-[#121a22cc] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8f8578]">Nuevos usuarios</p>
              <p className="font-data text-3xl leading-none text-[#f3eee7] mt-2">{periodNewUsers}</p>
            </article>

            <article className="rounded-2xl border border-[var(--line-0)] bg-[#121a22cc] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8f8578]">Cortes pagados</p>
              <p className="font-data text-3xl leading-none text-[#f0d8ad] mt-2">{periodPaidHaircuts}</p>
            </article>

            <article className="rounded-2xl border border-[var(--line-0)] bg-[#121a22cc] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8f8578]">Cortes gratis</p>
              <p className="font-data text-3xl leading-none text-[#89cf9f] mt-2">{periodFreeHaircuts}</p>
            </article>

            <article className="rounded-2xl border border-[var(--line-0)] bg-[#121a22cc] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8f8578]">Gratis / total</p>
              <p className="font-data text-3xl leading-none text-[#89cf9f] mt-2">{formatPercent(periodFreeShare)}</p>
              <p className="text-xs text-[#a89f93] mt-2">{periodTotalHaircuts} cortes en periodo</p>
            </article>
          </div>
        </section>

        <section className="bf-panel rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#f3eee7]">Actividad diaria</h2>
            <div className="text-[11px] text-[#8f8578] flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-[#c79a4e]" />
                Cortes
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-[#4fb27a]" />
                Registros
              </span>
            </div>
          </div>

          <div className="overflow-x-auto bf-scroll">
            <div className="min-w-[620px] grid grid-cols-12 gap-2">
              {activitySeries.map((item) => {
                const haircutHeight = Math.max(4, Math.round((item.haircuts / peakActivity) * 64))
                const userHeight = Math.max(4, Math.round((item.users / peakActivity) * 64))
                return (
                  <div key={item.key} className="rounded-xl border border-[var(--line-0)] bg-[#111a23cc] p-2">
                    <div className="h-16 flex items-end justify-center gap-1">
                      <div
                        className="w-2 rounded-sm bg-[#c79a4e]"
                        style={{ height: `${haircutHeight}px` }}
                        title={`Cortes: ${item.haircuts}`}
                      />
                      <div
                        className="w-2 rounded-sm bg-[#4fb27a]"
                        style={{ height: `${userHeight}px` }}
                        title={`Registros: ${item.users}`}
                      />
                    </div>
                    <p className="mt-2 text-[10px] text-center uppercase tracking-[0.08em] text-[#8f8578]">{item.label}</p>
                    <p className="text-[10px] text-center text-[#d9cfbf]">
                      {item.haircuts}/{item.users}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bf-panel rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#f3eee7]">Pagos por corte (sin gratis)</h2>
            <span className="text-[11px] text-[#8f8578]">{selectedPeriod.label}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <article className="rounded-2xl border border-[var(--line-0)] bg-[#121a22cc] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8f8578]">Ingreso periodo</p>
              <p className="font-data text-3xl leading-none text-[#f3eee7] mt-2">
                {formatPenFromCents(periodPaidRevenueCents)}
              </p>
            </article>
            <article className="rounded-2xl border border-[var(--line-0)] bg-[#121a22cc] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8f8578]">Cortes pagados</p>
              <p className="font-data text-3xl leading-none text-[#f0d8ad] mt-2">{periodPaidHaircuts}</p>
            </article>
            <article className="rounded-2xl border border-[var(--line-0)] bg-[#121a22cc] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8f8578]">Ticket por corte</p>
              <p className="font-data text-3xl leading-none text-[#c79a4e] mt-2">
                {formatPenFromCents(STANDARD_HAIRCUT_PRICE_CENTS)}
              </p>
            </article>
          </div>

          {periodClientPayments.length === 0 ? (
            <p className="text-sm text-[#a89f93]">Aun no hay cortes pagados en este periodo.</p>
          ) : (
            <div className="space-y-1.5">
              {periodClientPayments.map((client) => (
                <div
                  key={client.id}
                  className="rounded-xl border border-[var(--line-0)] bg-[#121a22cc] px-3 py-2.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-[#f3eee7] font-medium truncate">{client.name}</p>
                    <p className="text-xs text-[#a89f93] truncate">{client.phone}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-[#d9cfbf]">{client.paidCuts} corte(s) pagado(s)</p>
                    <p className="text-[11px] text-[#f0d8ad] font-semibold">
                      {formatPenFromCents(client.paidCents)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bf-panel rounded-3xl p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 rounded-2xl border border-[var(--line-0)] bg-[#0f171fcc] p-4 sm:p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#8f8578]">Operacion historica</p>
              <p className="font-data text-5xl sm:text-6xl leading-none text-[#f3eee7] mt-2">{totalHaircuts}</p>
              <p className="text-xs text-[#a89f93] mt-2">Cortes acumulados del negocio</p>

              <div className="h-px bg-gradient-to-r from-[#c79a4e66] via-[#c79a4e26] to-transparent my-4" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-[#8f8578]">Pagados (30d)</p>
                  <p className="text-2xl font-semibold text-[#f0d8ad]">{paidHaircutsLast30Days}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#8f8578]">Gratis (30d)</p>
                  <p className="text-2xl font-semibold text-[#89cf9f]">{freeHaircutsLast30Days}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <article className="rounded-2xl border border-[var(--line-0)] bg-[#121a22cc] p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#8f8578]">Usuarios</p>
                  <Users className="w-4 h-4 text-[#c79a4e]" />
                </div>
                <p className="font-data text-3xl leading-none text-[#f3eee7]">{totalUsers}</p>
                <p className="text-xs text-[#a89f93] mt-2">+{usersLast7Days} en 7 dias</p>
              </article>

              <article className="rounded-2xl border border-[var(--line-0)] bg-[#121a22cc] p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#8f8578]">Cortes</p>
                  <Scissors className="w-4 h-4 text-[#c79a4e]" />
                </div>
                <p className="font-data text-3xl leading-none text-[#f3eee7]">{totalHaircuts}</p>
                <p className="text-xs text-[#a89f93] mt-2">Historial completo</p>
              </article>

              <article className="rounded-2xl border border-[var(--line-0)] bg-[#121a22cc] p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#8f8578]">Gratis</p>
                  <Gift className="w-4 h-4 text-[#89cf9f]" />
                </div>
                <p className="font-data text-3xl leading-none text-[#89cf9f]">{totalFreeHaircuts}</p>
                <p className="text-xs text-[#a89f93] mt-2">{formatPercent(freeShare)} del total</p>
              </article>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <section className="bf-panel rounded-3xl p-4 sm:p-5 xl:col-span-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#f3eee7]">Ultimos registros</h2>
              <span className="text-[11px] text-[#8f8578]">Slug: {owner.business.slug}</span>
            </div>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-[#a89f93]">Aun no hay usuarios registrados.</p>
            ) : (
              <div className="space-y-1.5">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-xl border border-[var(--line-0)] bg-[#121a22cc] px-3 py-2.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-[#f3eee7] font-medium truncate">{user.name}</p>
                      <p className="text-xs text-[#a89f93] truncate">{user.phone}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-[#d9cfbf]">{formatDate(user.createdAt)}</p>
                      <p className="text-[11px] text-[#8f8578]">
                        Sellos {user.stamps} | Cortes {user.totalCuts}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bf-panel rounded-3xl p-4 sm:p-5 xl:col-span-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#f3eee7]">Top clientes</h2>
              <UserRound className="w-4 h-4 text-[#c79a4e]" />
            </div>
            {topUsers.length === 0 ? (
              <p className="text-sm text-[#a89f93]">Sin datos todavia.</p>
            ) : (
              <div className="space-y-1.5">
                {topUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="rounded-xl border border-[var(--line-0)] bg-[#121a22cc] px-3 py-2.5 flex items-center justify-between gap-3"
                  >
                    <p className="text-sm text-[#f3eee7] truncate">
                      <span className="inline-flex w-6 text-[#8f8578]">#{index + 1}</span>
                      {user.name}
                    </p>
                    <div className="text-right">
                      <p className="text-xs text-[#d9cfbf]">{user.totalCuts} cortes</p>
                      <p className="text-[11px] text-[#8f8578]">{user.stamps}/5</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>

        <section className="bf-panel-soft rounded-2xl p-3 sm:p-4 border border-[var(--line-0)]">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8f8578] mb-1">Lectura rapida</p>
          <p className="text-sm text-[#cfc3b3]">
            Nuevos usuarios en 30 dias: <span className="text-[#f3eee7] font-semibold">{usersLast30Days}</span>
            {' | '}
            Tasa de cortes gratis: <span className="text-[#89cf9f] font-semibold">{formatPercent(freeShare30d)}</span>
          </p>
        </section>
      </main>
    </div>
  )
}
