import { useQuery } from '@tanstack/react-query'
import { fetchRecommendations } from '@/lib/api'
export function useRecommendations(risk: number) {
  return useQuery({ queryKey: ['recs', risk], queryFn: () => fetchRecommendations(risk) })
}
