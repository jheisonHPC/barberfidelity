import { redirect } from 'next/navigation'

interface RegisterRedirectPageProps {
  params: Promise<{ businessSlug: string }>
}

export default async function RegisterRedirectPage({ params }: RegisterRedirectPageProps) {
  const { businessSlug } = await params
  redirect(`/${businessSlug}`)
}
