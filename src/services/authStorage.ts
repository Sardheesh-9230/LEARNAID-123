export type StoredUser = {
  id?: string
  _id?: string
  email?: string
  role?: string
  name?: string
}

const isBrowser = () => typeof window !== 'undefined'

const safeJsonParse = <T,>(value: string | null): T | null => {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const decodeJwtPayload = (token: string): any | null => {
  const parts = token.split('.')
  if (parts.length < 2) return null
  const payload = parts[1]
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const getAuthToken = (): string | null => {
  if (!isBrowser()) return null
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    null
  )
}

export const getStoredUser = (): StoredUser | null => {
  if (!isBrowser()) return null
  const user = safeJsonParse<StoredUser>(localStorage.getItem('user'))
  return user || null
}

export const getCurrentUserId = (): string | null => {
  if (!isBrowser()) return null

  const direct =
    localStorage.getItem('userId') ||
    localStorage.getItem('studentId') ||
    localStorage.getItem('currentUserId')
  if (direct) return direct

  const user = getStoredUser()
  const fromUser = user?.id || user?._id
  if (fromUser) return fromUser

  const token = getAuthToken()
  if (token) {
    const payload = decodeJwtPayload(token)
    const fromToken = payload?.id || payload?._id || payload?.userId || payload?.sub
    if (typeof fromToken === 'string' && fromToken) return fromToken
  }

  return null
}
