export type TitipRequestStatus =
  | 'submitted'
  | 'approved_waiting_payment'
  | 'funded'
  | 'unavailable'
  | 'purchased'
  | 'shipped'
  | 'completed'
  | 'refunded'

export interface TitipRequest {
  requestId: string
  groupId: string
  titiperAddress: string
  runnerAddress: string
  itemName: string
  itemLink: string
  variant: string
  quantity: number
  notes: string
  estimatedPrice: number | null   // titiper's rough guess, optional

  /**
   * All-in quote set by the runner on approval.
   * Covers: item cost + local taxes + import duties + shipping + runner margin.
   * This is the exact amount the titiper locks in escrow — no automatic fee added.
   */
  runnerQuote: number | null

  requestStatus: TitipRequestStatus
  createdAt: string
  statusUpdatedAt: string | null  // updated whenever status changes — used for auto-deliver timer
}

export interface CreateTitipRequestPayload {
  groupId: string
  runnerAddress: string
  itemName: string
  itemLink: string
  variant: string
  quantity: number
  notes: string
  estimatedPrice?: number
}

export interface ApproveTitipRequestPayload {
  requestId: string
  runnerQuote: number
}

export interface FundEscrowPayload {
  requestId: string
  totalAmountInStroops: number
}

export interface UpdateRequestStatusPayload {
  requestId: string
  status: TitipRequestStatus
}
