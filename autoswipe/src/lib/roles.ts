/** Parse User.roles JSON string — default BUYER */
export function parseRoles(rolesJson: string | undefined | null): string[] {
  if (!rolesJson) return ['BUYER']
  try {
    const v = JSON.parse(rolesJson) as unknown
    return Array.isArray(v) ? (v as string[]) : ['BUYER']
  } catch {
    return ['BUYER']
  }
}

export function hasRole(rolesJson: string | undefined | null, role: string): boolean {
  return parseRoles(rolesJson).includes(role)
}
