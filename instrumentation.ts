/** اولویت IPv4 برای جلوگیری از timeout اتصال Node به Supabase/Cloudflare */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dns = await import('node:dns')
    dns.setDefaultResultOrder('ipv4first')
  }
}
