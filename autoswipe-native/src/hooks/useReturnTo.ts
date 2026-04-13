import { useLocalSearchParams } from 'expo-router'

/** Normalized `returnTo` from the current route query (see `hrefWithReturn`). */
export function useReturnTo(): string | undefined {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>()
  return Array.isArray(returnTo) ? returnTo[0] : returnTo
}
