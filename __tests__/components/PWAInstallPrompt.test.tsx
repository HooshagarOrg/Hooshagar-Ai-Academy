import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'

describe('PWAInstallPrompt Component', () => {
  let mockPromptEvent: any

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()

    mockPromptEvent = {
      preventDefault: jest.fn(),
      prompt: jest.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    }
  })

  it('does not render initially', () => {
    render(<PWAInstallPrompt />)
    expect(screen.queryByText('نصب هوشاگر')).not.toBeInTheDocument()
  })

  it('shows prompt after beforeinstallprompt event', async () => {
    jest.useFakeTimers()

    render(<PWAInstallPrompt />)

    // Trigger beforeinstallprompt event
    window.dispatchEvent(
      new Event('beforeinstallprompt') as any
    )

    // Wait 3 seconds (as per component logic)
    jest.advanceTimersByTime(3000)

    await waitFor(() => {
      expect(screen.getByText('نصب هوشاگر')).toBeInTheDocument()
    })

    jest.useRealTimers()
  })

  it('does not show if already dismissed within 7 days', async () => {
    const sevenDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000
    localStorage.setItem('pwa-prompt-dismissed', sevenDaysAgo.toString())

    jest.useFakeTimers()

    render(<PWAInstallPrompt />)

    window.dispatchEvent(new Event('beforeinstallprompt') as any)
    jest.advanceTimersByTime(3000)

    await waitFor(() => {
      expect(screen.queryByText('نصب هوشاگر')).not.toBeInTheDocument()
    })

    jest.useRealTimers()
  })

  it('hides prompt when dismiss button clicked', async () => {
    jest.useFakeTimers()

    render(<PWAInstallPrompt />)

    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), mockPromptEvent)
    )

    jest.advanceTimersByTime(3000)

    await waitFor(() => {
      expect(screen.getByText('نصب هوشاگر')).toBeInTheDocument()
    })

    const dismissButton = screen.getByText('بعداً')
    fireEvent.click(dismissButton)

    await waitFor(() => {
      expect(screen.queryByText('نصب هوشاگر')).not.toBeInTheDocument()
    })

    jest.useRealTimers()
  })

  it('saves dismiss time to localStorage', async () => {
    jest.useFakeTimers()

    render(<PWAInstallPrompt />)

    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), mockPromptEvent)
    )

    jest.advanceTimersByTime(3000)

    await waitFor(() => {
      expect(screen.getByText('نصب هوشاگر')).toBeInTheDocument()
    })

    const dismissButton = screen.getByText('بعداً')
    fireEvent.click(dismissButton)

    expect(localStorage.getItem('pwa-prompt-dismissed')).toBeTruthy()

    jest.useRealTimers()
  })

  it('does not render when already installed', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })

    render(<PWAInstallPrompt />)

    expect(screen.queryByText('نصب هوشاگر')).not.toBeInTheDocument()
  })
})

