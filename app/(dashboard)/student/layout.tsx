/**
 * Student Layout
 * 
 * Layout برای بخش دانش‌آموزان
 */

// middleware احراز هویت را قبل از رسیدن به این layout بررسی می‌کند
// نیازی به getUser() (network call) نیست

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
    </div>
  )
}

