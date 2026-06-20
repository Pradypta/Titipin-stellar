export type TitipGroupStatus =
  | 'open'
  | 'closed'
  | 'sourcing'
  | 'completed'
  | 'canceled'

export interface TitipGroup {
  groupId: string
  runnerAddress: string
  title: string
  sourceLocation: string
  description: string
  openUntil: string
  estimatedPurchaseDate: string
  estimatedDeliveryDate: string
  groupStatus: TitipGroupStatus
  feePercentage: number
  createdAt: string
}

export interface CreateTitipGroupPayload {
  title: string
  sourceLocation: string
  description: string
  openUntil: string
  estimatedPurchaseDate: string
  estimatedDeliveryDate: string
}
