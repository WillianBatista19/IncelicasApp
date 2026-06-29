const VERIFIED = new Set(['zaplioficial'])

export function isVerified(username: string): boolean {
  return VERIFIED.has(username)
}
