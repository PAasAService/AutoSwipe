import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import { User } from '../types'

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: () =>
      api.get<{ data: User }>('/api/users/me').then((r) => {
        const user = r.data
        // roles may come as JSON string from backend
        if (typeof user.roles === 'string') {
          try { user.roles = JSON.parse(user.roles as any) } catch { user.roles = [] }
        }
        return user
      }),
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}
