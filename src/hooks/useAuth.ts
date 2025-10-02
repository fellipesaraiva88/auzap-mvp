import { useEffect, useState } from 'react'
import { authService, type UserProfile } from '@/services/auth.service'
import { socketManager } from '@/lib/socket'

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if authenticated and get user profile
    const loadUser = async () => {
      try {
        if (authService.isAuthenticated()) {
          const profile = await authService.getProfile()
          setUser(profile)

          // Connect socket and join organization
          const token = localStorage.getItem('auth_token')
          if (token) {
            socketManager.connect(token)
            socketManager.joinOrganization(profile.organization_id)
          }
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
        authService.logout()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()

    return () => {
      socketManager.disconnect()
    }
  }, [])

  const signOut = async () => {
    authService.logout()
    socketManager.disconnect()
    setUser(null)
    window.location.href = '/'
  }

  return { user, loading, signOut }
}
