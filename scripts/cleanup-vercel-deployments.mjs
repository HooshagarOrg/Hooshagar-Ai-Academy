/**
 * Deletes old Vercel deployments for hooshagar-project.
 * Keeps the live production aliases and one previous Ready production for rollback.
 */
const TOKEN = process.env.VERCEL_TOKEN
const TEAM_ID = process.env.VERCEL_ORG_ID
const PROJECT_ID = process.env.VERCEL_PROJECT_ID
const LIVE_HOSTS = ['www.hooshagar.ir', 'hooshagar.ir']

if (!TOKEN || !TEAM_ID || !PROJECT_ID) {
  throw new Error('VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID are required')
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
}

/**
 * @param {string} path
 * @param {RequestInit} [init]
 * @returns {Promise<unknown>}
 */
async function vercel(path, init = {}) {
  const url = path.startsWith('http')
    ? path
    : `https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${encodeURIComponent(TEAM_ID)}`
  const response = await fetch(url, { ...init, headers: { ...headers, ...init.headers } })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      typeof body === 'object' && body && 'error' in body
        ? JSON.stringify(body.error)
        : response.statusText
    throw new Error(`${init.method || 'GET'} ${path} failed: ${response.status} ${message}`)
  }
  return body
}

/**
 * @returns {Promise<Array<{ uid: string, created: number, state?: string, target?: string | null, url?: string }>>}
 */
async function listDeployments() {
  /** @type {Array<{ uid: string, created: number, state?: string, target?: string | null, url?: string }>} */
  const all = []
  let until = ''
  for (let page = 0; page < 20; page += 1) {
    const params = new URLSearchParams({
      projectId: PROJECT_ID,
      teamId: TEAM_ID,
      limit: '100',
    })
    if (until) params.set('until', until)
    const data = /** @type {{ deployments?: typeof all, pagination?: { next?: number } }} */ (
      await vercel(`https://api.vercel.com/v6/deployments?${params.toString()}`, {
        headers,
      })
    )
    const batch = data.deployments ?? []
    all.push(...batch)
    const nextUntil = data.pagination?.next ? String(data.pagination.next) : ''
    if (!nextUntil || batch.length === 0 || nextUntil === until) break
    until = nextUntil
  }
  return all
}

/**
 * @param {string} host
 * @returns {Promise<string | null>}
 */
async function liveDeploymentId(host) {
  try {
    const data = /** @type {{ uid?: string, id?: string } } */ (
      await vercel(`/v13/deployments/${encodeURIComponent(host)}`)
    )
    return data.uid || data.id || null
  } catch (error) {
    console.warn(`Could not resolve ${host}:`, error instanceof Error ? error.message : error)
    return null
  }
}

async function shortenRetention() {
  const payload = {
    expiration: '1d',
    expirationProduction: '1w',
    expirationCanceled: '1d',
    expirationErrored: '1d',
  }
  try {
    await vercel(`/v9/projects/${PROJECT_ID}/deployment-expiration`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    console.log('Retention set: preview/canceled/errored 1d, production 7d')
  } catch (error) {
    console.warn(
      'Retention policy update skipped:',
      error instanceof Error ? error.message : error,
    )
  }
}

async function main() {
  const liveIds = new Set()
  for (const host of LIVE_HOSTS) {
    const id = await liveDeploymentId(host)
    if (id) liveIds.add(id)
  }

  const deployments = await listDeployments()
  const productionReady = deployments
    .filter((item) => item.target === 'production' && item.state === 'READY')
    .sort((a, b) => b.created - a.created)

  const rollback = productionReady.find((item) => !liveIds.has(item.uid))
  const keep = new Set(liveIds)
  if (rollback) keep.add(rollback.uid)
  if (keep.size === 0 && productionReady[0]) {
    keep.add(productionReady[0].uid)
    console.warn('Live alias unresolved; keeping newest Ready production')
  }
  if (keep.size === 0) {
    throw new Error('Refusing to delete: could not resolve a production deployment to keep')
  }

  const inProgress = new Set(['BUILDING', 'QUEUED', 'INITIALIZING', 'DEPLOYING'])

  console.log(
    `Listed ${deployments.length} deployments; keeping ${[...keep].join(', ')}`,
  )

  let deleted = 0
  let skipped = 0
  let failed = 0
  for (const item of deployments) {
    if (keep.has(item.uid) || inProgress.has(item.state || '')) {
      skipped += 1
      continue
    }
    try {
      await vercel(`/v13/deployments/${item.uid}`, { method: 'DELETE' })
      deleted += 1
      console.log(`Deleted ${item.uid} (${item.target || 'preview'} ${item.state || ''} ${item.url || ''})`)
      await new Promise((resolve) => setTimeout(resolve, 400))
    } catch (error) {
      failed += 1
      console.warn(
        `Skip ${item.uid}:`,
        error instanceof Error ? error.message : error,
      )
    }
  }

  await shortenRetention()
  console.log(`Done. deleted=${deleted} kept=${skipped} failed=${failed}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
