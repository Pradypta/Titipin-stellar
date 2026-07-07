// A "group" is now a runner's PROFILE — one per runner (keyed by wallet address).
// Status is a simple Ready / Not Ready toggle the runner controls.
export type TitipGroupStatus = 'ready' | 'not_ready'

// Every connected wallet has ONE row (an "account"). `isRunner` distinguishes a
// full runner profile from a plain titiper account that only set a username.
export interface TitipGroup {
  groupId: string          // one row per wallet — equals the wallet address
  runnerAddress: string
  username: string         // display name        (stored in DB column `title`)
  location: string         // current location    (stored in DB column `source_location`)
  background: string       // about the runner    (stored in DB column `description`)
  whatsappNumber: string   // international format, for click-to-chat
  isRunner: boolean        // true once they've filled the runner profile
  groupStatus: TitipGroupStatus
  feePercentage: number
  createdAt: string
}
