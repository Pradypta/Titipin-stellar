export type UserRole = 'runner' | 'titiper' | 'guest'

export interface WalletState {
  isConnected: boolean
  publicKey: string | null
  network: 'testnet' | 'mainnet' | null
}
