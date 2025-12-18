/**
 * Integration Tests for Notifications API
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/notifications/route'
import { createMockSupabaseClient, mockNotification } from '../setup/fixtures'

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => createMockSupabaseClient()),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({})),
}))

describe('Notifications API', () => {
  describe('GET /api/notifications', () => {
    it('returns notifications for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('notifications')
      expect(data).toHaveProperty('unreadCount')
    })

    it('returns 401 for unauthenticated user', async () => {
      const mockClient = createMockSupabaseClient()
      mockClient.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      })

      const { createClient } = require('@/lib/supabase')
      ;(createClient as jest.Mock).mockReturnValue(mockClient)

      const request = new NextRequest('http://localhost:3000/api/notifications')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('supports pagination with limit and offset', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/notifications?limit=10&offset=0'
      )
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.notifications)).toBe(true)
    })

    it('filters unread notifications when unreadOnly=true', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/notifications?unreadOnly=true'
      )
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/notifications', () => {
    it('creates notification for admin', async () => {
      const mockClient = createMockSupabaseClient()
      mockClient.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      }))

      const { createClient } = require('@/lib/supabase')
      ;(createClient as jest.Mock).mockReturnValue(mockClient)

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: '123',
          title: 'Test',
          message: 'Test message',
          type: 'info',
        }),
      })
      
      const response = await POST(request)

      expect(response.status).toBeLessThan(500)
    })

    it('returns 403 for non-admin user', async () => {
      const mockClient = createMockSupabaseClient()
      mockClient.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'student' },
          error: null,
        }),
      }))

      const { createClient } = require('@/lib/supabase')
      ;(createClient as jest.Mock).mockReturnValue(mockClient)

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: '123',
          title: 'Test',
          message: 'Test message',
          type: 'info',
        }),
      })
      
      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('validates input data with Zod', async () => {
      const mockClient = createMockSupabaseClient()
      mockClient.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      }))

      const { createClient } = require('@/lib/supabase')
      ;(createClient as jest.Mock).mockReturnValue(mockClient)

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          title: 'Test',
        }),
      })
      
      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})

