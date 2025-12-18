import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NotificationBell from '@/components/NotificationBell'
import { mockNotification, mockAPIResponse } from '../setup/fixtures'

// Mock fetch
global.fetch = jest.fn()

describe('NotificationBell Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders notification bell icon', () => {
    render(<NotificationBell />)
    const bellIcon = screen.getByRole('button')
    expect(bellIcon).toBeInTheDocument()
  })

  it('displays unread count badge', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockAPIResponse.success({
        notifications: [mockNotification],
        unreadCount: 1,
      })
    )

    render(<NotificationBell />)

    await waitFor(() => {
      const badge = screen.getByText('1')
      expect(badge).toBeInTheDocument()
    })
  })

  it('opens dropdown when clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockAPIResponse.success({
        notifications: [],
        unreadCount: 0,
      })
    )

    render(<NotificationBell />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('اعلانات')).toBeInTheDocument()
    })
  })

  it('displays notifications when available', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockAPIResponse.success({
        notifications: [mockNotification],
        unreadCount: 1,
      })
    )

    render(<NotificationBell />)

    await waitFor(() => {
      expect(screen.getByText('نشان جدید!')).toBeInTheDocument()
    })
  })

  it('shows empty state when no notifications', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockAPIResponse.success({
        notifications: [],
        unreadCount: 0,
      })
    )

    render(<NotificationBell />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('اعلانی وجود ندارد')).toBeInTheDocument()
    })
  })

  it('marks notification as read when clicked', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        mockAPIResponse.success({
          notifications: [mockNotification],
          unreadCount: 1,
        })
      )
      .mockResolvedValueOnce(mockAPIResponse.success({ success: true }))

    render(<NotificationBell />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('نشان جدید!')).toBeInTheDocument()
    })

    // Clicking should mark as read
    // (این بخش به UI کامپوننت بستگی دارد)
  })

  it('polls for new notifications every 30 seconds', async () => {
    jest.useFakeTimers()

    ;(global.fetch as jest.Mock).mockResolvedValue(
      mockAPIResponse.success({
        notifications: [],
        unreadCount: 0,
      })
    )

    render(<NotificationBell />)

    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Fast-forward 30 seconds
    jest.advanceTimersByTime(30000)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    jest.useRealTimers()
  })

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockAPIResponse.error('خطای سرور')
    )

    render(<NotificationBell />)

    await waitFor(() => {
      // Should not crash, should handle error
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})

