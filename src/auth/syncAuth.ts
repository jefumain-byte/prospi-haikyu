const AUTH_SESSION_KEY = 'prospi-auth-user-v1'

const configuredUser = import.meta.env.VITE_SYNC_USER?.trim() ?? ''
const configuredPassword = import.meta.env.VITE_SYNC_PASSWORD ?? ''

export function isAuthConfigured(): boolean {
  return configuredUser.length > 0 && configuredPassword.length > 0
}

export function verifyLogin(userId: string, password: string): boolean {
  if (!isAuthConfigured()) return false
  return userId.trim() === configuredUser && password === configuredPassword
}

export function getSessionUser(): string | null {
  return sessionStorage.getItem(AUTH_SESSION_KEY)
}

export function setSessionUser(userId: string): void {
  sessionStorage.setItem(AUTH_SESSION_KEY, userId.trim())
}

export function clearSessionUser(): void {
  sessionStorage.removeItem(AUTH_SESSION_KEY)
}

export function getCloudKeyForUser(userId: string): string {
  return `user:${userId.trim()}`
}

export function getActiveCloudKey(): string | null {
  const user = getSessionUser()
  if (!user) return null
  return getCloudKeyForUser(user)
}
