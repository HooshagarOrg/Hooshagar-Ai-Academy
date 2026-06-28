'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { HooshagarLogo, HooshagarMark } from '@/components/brand/hooshagar-logo'
import {
  commonItems,
  getArcColor,
  getRoleLabel,
  isNavActive,
  mobileTabItems,
  resolveNavGroups,
} from '@/lib/nav/config'

export interface LuxNavProps {
  role: string
  userName: string
  schoolName?: string
  avatarUrl?: string
  collapsed?: boolean
  onCollapse?: (v: boolean) => void
}

export function LuxNav({
  role,
  userName,
  schoolName,
  avatarUrl,
  collapsed = false,
  onCollapse,
}: LuxNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [logoutOpen, setLogoutOpen] = useState(false)

  const groups = resolveNavGroups(role)
  const arc = getArcColor(role)

  const itemBase =
    'lux-focus-ring flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 min-h-[44px] group cursor-pointer'
  const itemInactive = 'text-[var(--lux-text-muted)] hover:text-[var(--lux-text)] hover:bg-white/[0.04]'

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          'flex flex-col h-full transition-[width] duration-200',
          collapsed ? 'w-[4.5rem]' : 'w-64',
        )}
        style={{
          background: 'var(--lux-void)',
          borderInlineStart: '1px solid rgba(232,236,244,0.06)',
        }}
        dir="rtl"
      >
        <div
          className={cn(
            'flex items-center border-b transition-all',
            collapsed ? 'justify-center p-4' : 'justify-between px-4 py-4',
          )}
          style={{ borderColor: 'rgba(232,236,244,0.06)' }}
        >
          {!collapsed && (
            <HooshagarLogo size="sm" href="/dashboard" subtitle={schoolName} showWordmark surface="void" inverted />
          )}
          {collapsed && (
            <Link href="/dashboard" className="rounded-xl focus-visible:ring-2 focus-visible:ring-white/20">
              <HooshagarMark size={32} surface="void" />
            </Link>
          )}
          {onCollapse && (
            <button
              type="button"
              onClick={() => onCollapse(!collapsed)}
              className="lux-focus-ring p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--lux-text-muted)] hover:text-[var(--lux-text)] transition-colors"
              aria-label={collapsed ? 'باز کردن منو' : 'جمع کردن منو'}
            >
              {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="px-3 py-3" style={{ borderBottom: '1px solid rgba(232,236,244,0.06)' }}>
            <Link
              href="/profile"
              className="lux-focus-ring flex items-center gap-3 p-2.5 rounded-2xl transition-colors"
              style={{ background: `color-mix(in srgb, ${arc} 8%, transparent)` }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: `color-mix(in srgb, ${arc} 22%, #1a1f2e)` }}
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt={userName} className="w-full h-full rounded-xl object-cover" />
                  : userName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--lux-text)] truncate">{userName}</p>
                <p className="text-xs font-medium" style={{ color: arc }}>{getRoleLabel(role)}</p>
              </div>
            </Link>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin" aria-label="ناوبری">
          {groups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-3' : ''}>
              {!collapsed && group.title && (
                <p className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 mb-0.5 text-[var(--lux-text-muted)]/70">
                  {group.title}
                </p>
              )}
              {collapsed && group.title && gi > 0 && (
                <div className="h-px mx-2 my-2" style={{ background: 'rgba(232,236,244,0.06)' }} />
              )}
              {group.items.map((item) => {
                const active = isNavActive(pathname, item.href)
                const Icon = item.icon
                return collapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className="lux-focus-ring flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-colors min-h-[44px]"
                        style={active
                          ? { color: arc, background: `color-mix(in srgb, ${arc} 14%, transparent)` }
                          : undefined}
                        aria-current={active ? 'page' : undefined}
                        aria-label={item.title}
                      >
                        <Icon className={cn('w-4.5 h-4.5', !active && 'text-[var(--lux-text-muted)]')} />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs">{item.title}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(itemBase, active ? '' : itemInactive)}
                    style={active ? { color: arc, background: `color-mix(in srgb, ${arc} 12%, transparent)` } : undefined}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                    {item.badge !== undefined && (
                      <Badge className="mr-auto text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] bg-red-500 text-white">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}

          <div className="mt-3">
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 text-[var(--lux-text-muted)]/70">
                عمومی
              </p>
            )}
            {collapsed && <div className="h-px mx-2 my-2" style={{ background: 'rgba(232,236,244,0.06)' }} />}
            {commonItems.map((item) => {
              const active = isNavActive(pathname, item.href)
              const Icon = item.icon
              return collapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className="lux-focus-ring flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-colors min-h-[44px]"
                      style={active ? { color: arc, background: `color-mix(in srgb, ${arc} 14%, transparent)` } : undefined}
                      aria-label={item.title}
                    >
                      <Icon className={cn('w-4.5 h-4.5', !active && 'text-[var(--lux-text-muted)]')} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">{item.title}</TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(itemBase, active ? '' : itemInactive)}
                  style={active ? { color: arc, background: `color-mix(in srgb, ${arc} 12%, transparent)` } : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="p-2 space-y-0.5" style={{ borderTop: '1px solid rgba(232,236,244,0.06)' }}>
          {collapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/settings"
                    className="lux-focus-ring flex items-center justify-center touch-target rounded-xl text-[var(--lux-text-muted)] hover:bg-white/[0.06] hover:text-[var(--lux-text)] transition-colors min-h-[44px] min-w-[44px]"
                    aria-label="تنظیمات"
                  >
                    <Settings className="w-4.5 h-4.5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">تنظیمات</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setLogoutOpen(true)}
                    className="lux-focus-ring flex items-center justify-center touch-target rounded-xl text-red-400 hover:bg-red-500/10 transition-colors min-h-[44px] min-w-[44px]"
                    aria-label="خروج از حساب"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">خروج</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Link href="/settings" className={cn(itemBase, itemInactive)}>
                <Settings className="w-4 h-4 text-[var(--lux-text-muted)] group-hover:text-[var(--lux-text)]" />
                <span>تنظیمات</span>
              </Link>
              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                className="lux-focus-ring w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از حساب</span>
              </button>
            </>
          )}
        </div>
      </aside>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent dir="rtl" className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">خروج از حساب</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
            <AlertDialogAction
              onClick={() => router.push('/api/auth/logout')}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              بله، خارج می‌شوم
            </AlertDialogAction>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}

export function LuxMobileNav({ role }: { role: string }) {
  const pathname = usePathname()
  const arc = getArcColor(role)
  const navRole = role === 'platform_admin' ? 'admin' : role
  const items = mobileTabItems[navRole] ?? mobileTabItems.admin

  return (
    <nav
      className="lg:hidden fixed bottom-0 right-0 left-0 z-50 pt-1 pb-safe px-safe"
      dir="rtl"
      aria-label="ناوبری موبایل"
    >
      <div
        className="flex items-center justify-around h-16 min-h-[4rem] px-1 backdrop-blur-md"
        style={{
          background: 'rgba(11,13,18,0.92)',
          borderTop: '1px solid rgba(232,236,244,0.08)',
        }}
      >
        {items.map((item) => {
          const active = isNavActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="lux-focus-ring flex flex-col items-center gap-0.5 flex-1 py-1 rounded-xl transition-colors min-h-[3rem]"
              aria-current={active ? 'page' : undefined}
              aria-label={item.title}
            >
              <div
                className="touch-target w-11 h-11 rounded-xl flex items-center justify-center transition-colors"
                style={active ? { background: `color-mix(in srgb, ${arc} 14%, transparent)` } : undefined}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: active ? arc : 'var(--lux-text-muted)' }}
                />
              </div>
              <span
                className="text-[10px] font-semibold"
                style={{ color: active ? arc : 'var(--lux-text-muted)' }}
              >
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
