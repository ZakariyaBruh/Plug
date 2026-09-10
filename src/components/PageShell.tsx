import { SiteFooter } from '#/components/SiteFooter'
import { SiteHeader } from '#/components/SiteHeader'

export function PageShell({
  user,
  children,
}: {
  user: { name?: string | null; preferred_username?: string | null } | null
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  )
}
