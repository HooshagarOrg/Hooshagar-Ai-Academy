import fs from 'fs'
import path from 'path'

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, acc)
    else if (ent.name === 'page.tsx') acc.push(p.replace(/\\/g, '/'))
  }
  return acc
}

function toRoute(file) {
  let r = file.replace(/^app\//, '').replace(/\/page\.tsx$/, '')
  if (r === 'page.tsx') return '/'
  r = r.replace(/^\(auth\)\//, '').replace(/^\(dashboard\)\//, '')
  r = r.replace(/\[\[\.\.\.[^\]]+\]\]/g, ':param')
  r = r.replace(/\[([^\]]+)\]/g, ':$1')
  return `/${r}`
}

function categorize(route) {
  if (route.startsWith('/test-')) {
    return {
      cat: 'تست / Dev',
      role: '—',
      layout: 'بدون shell',
      priority: 'P3',
      status: 'خارج از scope',
      notes: 'فقط توسعه و QA',
    }
  }
  if (route === '/') {
    return {
      cat: 'مارکتینگ',
      role: 'عمومی',
      layout: 'Obsidian Meridian',
      priority: 'P0',
      status: 'بازطراحی شده',
      notes: 'لندینگ اصلی',
    }
  }
  if (['/pricing', '/terms', '/privacy', '/checkout', '/offline'].includes(route)) {
    return {
      cat: 'مارکتینگ',
      role: 'عمومی',
      layout: 'MarketingShell / قدیمی',
      priority: 'P1',
      status: 'نیاز به یکپارچه‌سازی',
      notes: 'هماهنگ با Obsidian Meridian نیست',
    }
  }
  if (
    ['/login', '/register', '/change-password', '/help'].includes(route) ||
    route.startsWith('/activate')
  ) {
    return {
      cat: 'احراز هویت',
      role: 'عمومی',
      layout: 'Obsidian Portal',
      priority: 'P0',
      status: 'بازطراحی شده',
      notes: 'ورود و ثبت‌نام',
    }
  }
  if (route === '/profile') {
    return {
      cat: 'پروفایل',
      role: 'مشترک',
      layout: 'DashboardShell',
      priority: 'P0',
      status: 'نیاز به polish',
      notes: 'پروفایل همه نقش‌ها',
    }
  }
  if (route === '/account/privacy') {
    return {
      cat: 'پروفایل',
      role: 'مشترک',
      layout: 'DashboardShell',
      priority: 'P2',
      status: 'نیاز به polish',
      notes: 'حریم خصوصی',
    }
  }
  if (route.startsWith('/notifications') || route === '/messages') {
    return {
      cat: 'اعلان و پیام',
      role: 'مشترک',
      layout: 'DashboardShell',
      priority: 'P1',
      status: 'نیاز به polish',
      notes: '',
    }
  }
  if (['/dashboard', '/leaderboard'].includes(route) || route.startsWith('/surveys/')) {
    return {
      cat: 'مشترک داشبورد',
      role: 'مشترک',
      layout: 'DashboardShell',
      priority: 'P1',
      status: 'نیاز به polish',
      notes: '',
    }
  }

  const roleRules = [
    { prefix: '/admin', cat: 'ادمین', role: 'admin', layout: 'DashboardShell', home: '/admin' },
    {
      prefix: '/student',
      cat: 'دانش‌آموز',
      role: 'student',
      layout: 'DashboardShell + FAB هوشیار',
      home: '/student',
      homeNote: 'داشبورد اصلی دانش‌آموز',
    },
    { prefix: '/teacher', cat: 'معلم', role: 'teacher', layout: 'DashboardShell', home: '/teacher' },
    { prefix: '/parent', cat: 'والدین', role: 'parent', layout: 'DashboardShell', home: '/parent' },
    { prefix: '/counselor', cat: 'مشاور', role: 'counselor', layout: 'DashboardShell', home: '/counselor' },
    { prefix: '/principal', cat: 'مدیر مدرسه', role: 'principal', layout: 'DashboardShell' },
    { prefix: '/educational-vp', cat: 'معاون آموزشی', role: 'educational_vp', layout: 'DashboardShell' },
    { prefix: '/financial-vp', cat: 'معاون مالی', role: 'financial_vp', layout: 'DashboardShell' },
    { prefix: '/discipline-vp', cat: 'معاون انضباطی', role: 'disciplinary_vp', layout: 'DashboardShell' },
    { prefix: '/health-vp', cat: 'معاون بهداشت', role: 'health_vp', layout: 'DashboardShell' },
    { prefix: '/evaluation-vp', cat: 'معاون ارزشیابی', role: 'evaluation_vp', layout: 'DashboardShell' },
    { prefix: '/art-teacher', cat: 'معلم هنر', role: 'art_teacher', layout: 'DashboardShell' },
    { prefix: '/sports-teacher', cat: 'معلم ورزش', role: 'sports_teacher', layout: 'DashboardShell' },
    { prefix: '/librarian', cat: 'کتابدار', role: 'librarian', layout: 'DashboardShell' },
    { prefix: '/maintenance', cat: 'تاسیسات', role: 'maintenance', layout: 'DashboardShell' },
    { prefix: '/secretary', cat: 'منشی', role: 'secretary', layout: 'DashboardShell' },
    { prefix: '/security', cat: 'حراست', role: 'security', layout: 'DashboardShell' },
  ]

  for (const rule of roleRules) {
    if (route.startsWith(rule.prefix)) {
      const isHome = rule.home === route
      const isCounselor = rule.prefix === '/counselor'
      return {
        cat: rule.cat,
        role: rule.role,
        layout: rule.layout,
        priority: isHome ? 'P0' : isCounselor ? 'P2' : rule.home ? 'P1' : 'P2',
        status: 'نیاز به polish',
        notes: isHome && rule.homeNote ? rule.homeNote : '',
      }
    }
  }

  return {
    cat: 'سایر',
    role: '—',
    layout: 'نامشخص',
    priority: 'P2',
    status: 'نیاز به بررسی',
    notes: '',
  }
}

const files = walk('app').sort()
const rows = files.map((file, i) => {
  const route = toRoute(file)
  const meta = categorize(route)
  return { id: i + 1, route, file, ...meta }
})

const esc = (s) => `"${String(s).replace(/"/g, '""')}"`
const header = [
  'شماره',
  'مسیر',
  'فایل',
  'دسته',
  'نقش',
  'Layout/تم',
  'اولویت',
  'وضعیت UI/UX',
  'یادداشت',
  'Responsive',
  'Loading',
  'Accessibility',
  'انیمیشن',
]

const csv = [
  header.join(','),
  ...rows.map((r) =>
    [
      r.id,
      r.route,
      r.file,
      r.cat,
      r.role,
      r.layout,
      r.priority,
      r.status,
      r.notes,
      'خیر',
      'خیر',
      'خیر',
      'خیر',
    ]
      .map(esc)
      .join(','),
  ),
].join('\n')

const outDir = 'docs/ui-ux'
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(`${outDir}/PAGES_INVENTORY.csv`, `\uFEFF${csv}`, 'utf8')

const byCat = {}
for (const r of rows) {
  if (!byCat[r.cat]) byCat[r.cat] = []
  byCat[r.cat].push(r)
}

let md = '# چک‌لیست UI/UX — فاز ۶ (هوشاگر)\n\n'
md += `> تولید خودکار از \`app/**/page.tsx\` — ${new Date().toISOString().slice(0, 10)}\n\n`
md += `**جمع صفحات:** ${rows.length}\n\n`
md += '## خلاصه دسته‌ها\n\n'
md += '| دسته | تعداد | P0 | P1 | P2 | P3 |\n|------|------:|---:|---:|---:|---:|\n'

for (const [cat, items] of Object.entries(byCat).sort((a, b) => b[1].length - a[1].length)) {
  const p0 = items.filter((x) => x.priority === 'P0').length
  const p1 = items.filter((x) => x.priority === 'P1').length
  const p2 = items.filter((x) => x.priority === 'P2').length
  const p3 = items.filter((x) => x.priority === 'P3').length
  md += `| ${cat} | ${items.length} | ${p0} | ${p1} | ${p2} | ${p3} |\n`
}

md += '\n## Legend\n\n'
md += '- **P0** — بحرانی (لندینگ، auth، داشبورد اصلی نقش)\n'
md += '- **P1** — بالا (صفحات پرترافیک)\n'
md += '- **P2** — متوسط\n'
md += '- **P3** — تست / dev\n\n'
md += 'ستون‌های چک‌لیست: Responsive · Loading · Accessibility · انیمیشن\n\n'

for (const [cat, items] of Object.entries(byCat).sort((a, b) => a[0].localeCompare(b[0], 'fa'))) {
  md += `## ${cat} (${items.length})\n\n`
  md += '| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |\n'
  md += '|------|--------|--------|:--:|:--:|:--:|:--:|---------|\n'
  for (const r of items.sort((a, b) => a.route.localeCompare(b.route))) {
    md += `| \`${r.route}\` | ${r.priority} | ${r.status} | [ ] | [ ] | [ ] | [ ] | ${r.notes || '—'} |\n`
  }
  md += '\n'
}

fs.writeFileSync(`${outDir}/PHASE6_UIUX_CHECKLIST.md`, md, 'utf8')

console.log(`Rows: ${rows.length}`)
console.log(`CSV: ${outDir}/PAGES_INVENTORY.csv`)
console.log(`MD: ${outDir}/PHASE6_UIUX_CHECKLIST.md`)
