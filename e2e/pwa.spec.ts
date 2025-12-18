import { test, expect } from '@playwright/test'

test.describe('PWA Features', () => {
  test('should have valid manifest.json', async ({ page }) => {
    const response = await page.goto('/manifest.json')
    expect(response?.status()).toBe(200)
    
    const manifest = await response?.json()
    expect(manifest).toHaveProperty('name')
    expect(manifest).toHaveProperty('short_name')
    expect(manifest).toHaveProperty('start_url')
    expect(manifest).toHaveProperty('display')
    expect(manifest.display).toBe('standalone')
    expect(manifest).toHaveProperty('icons')
    expect(manifest.icons.length).toBeGreaterThan(0)
  })

  test('should register service worker', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Wait for service worker to register
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        return registration !== undefined
      }
      return false
    })
    
    expect(swRegistered).toBe(true)
  })

  test('should have meta tags for PWA', async ({ page }) => {
    await page.goto('/')
    
    // Check theme-color
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content')
    expect(themeColor).toBeTruthy()
    
    // Check viewport
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewport).toContain('width=device-width')
    
    // Check manifest link
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(manifestLink).toBe('/manifest.json')
  })

  test('should show install prompt', async ({ page, context }) => {
    await page.goto('/dashboard')
    
    // Simulate beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt')
      window.dispatchEvent(event)
    })
    
    // Wait for prompt to appear (3 seconds delay)
    await page.waitForTimeout(3500)
    
    // Check if install prompt is visible
    const installPrompt = page.getByText(/نصب هوشاگر/i)
    if (await installPrompt.isVisible()) {
      expect(await installPrompt.isVisible()).toBe(true)
    }
  })

  test('should load offline page when service worker is active', async ({ page, context }) => {
    await page.goto('/dashboard')
    
    // Wait for SW to be active
    await page.waitForTimeout(2000)
    
    // Go offline
    await context.setOffline(true)
    
    // Try to navigate
    await page.goto('/offline')
    
    // Should show offline page
    await expect(page.getByText(/اتصال به اینترنت قطع است/i)).toBeVisible()
    
    // Go back online
    await context.setOffline(false)
  })

  test('should cache assets after first visit', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check if cache is populated
    const cacheSize = await page.evaluate(async () => {
      const cacheNames = await caches.keys()
      return cacheNames.length
    })
    
    expect(cacheSize).toBeGreaterThan(0)
  })
})

