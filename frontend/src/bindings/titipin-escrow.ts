import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CB4YBYZMZITNAGE2U3LCA3WPUHGXJGWVZ7Z2PKB3S3ZUBPUVXZQALEKB",
  }
} as const

export type DataKey = {tag: "Request", values: readonly [string]};

export type EscrowStatus = {tag: "Registered", values: void} | {tag: "Funded", values: void} | {tag: "Completed", values: void} | {tag: "Refunded", values: void};


export interface EscrowRequest {
  amount: i128;
  runner: string;
  status: EscrowStatus;
  titiper: string;
  token: string;
}

export interface Client {
  /**
   * Construct and simulate a get_request transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read the current on-chain state of a request.
   */
  get_request: ({request_id}: {request_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<EscrowRequest>>

  /**
   * Construct and simulate a fund_request transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Titiper locks XLM into this contract.
   * Requires Freighter signature from the titiper.
   * Token is transferred: titiper → contract.
   */
  fund_request: ({request_id, titiper}: {request_id: string, titiper: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a create_request transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Runner registers an escrow request after approving the titiper's item.
   * Locks in the terms: who pays, who receives, how much.
   * Must be called by the runner before the titiper can fund.
   */
  create_request: ({request_id, runner, titiper, token, amount}: {request_id: string, runner: string, titiper: string, token: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a refund_request transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Runner marks the item as unavailable (sold out, trip canceled, etc).
   * Automatically refunds funds: contract → titiper.
   * Only the runner can call this.
   */
  refund_request: ({request_id, runner}: {request_id: string, runner: string}, options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a confirm_receipt transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Titiper confirms they received the item.
   * Automatically releases funds: contract → runner.
   * Only the titiper can call this.
   */
  confirm_receipt: ({request_id, titiper}: {request_id: string, titiper: string}, options?: MethodOptions) => Promise<AssembledTransaction<string>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAQAAAAEAAAAAAAAAB1JlcXVlc3QAAAAAAQAAABA=",
        "AAAAAgAAAAAAAAAAAAAADEVzY3Jvd1N0YXR1cwAAAAQAAAAAAAAAAAAAAApSZWdpc3RlcmVkAAAAAAAAAAAAAAAAAAZGdW5kZWQAAAAAAAAAAAAAAAAACUNvbXBsZXRlZAAAAAAAAAAAAAAAAAAACFJlZnVuZGVk",
        "AAAAAQAAAAAAAAAAAAAADUVzY3Jvd1JlcXVlc3QAAAAAAAAFAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAABnJ1bm5lcgAAAAAAEwAAAAAAAAAGc3RhdHVzAAAAAAfQAAAADEVzY3Jvd1N0YXR1cwAAAAAAAAAHdGl0aXBlcgAAAAATAAAAAAAAAAV0b2tlbgAAAAAAABM=",
        "AAAAAAAAAC1SZWFkIHRoZSBjdXJyZW50IG9uLWNoYWluIHN0YXRlIG9mIGEgcmVxdWVzdC4AAAAAAAALZ2V0X3JlcXVlc3QAAAAAAQAAAAAAAAAKcmVxdWVzdF9pZAAAAAAAEAAAAAEAAAfQAAAADUVzY3Jvd1JlcXVlc3QAAAA=",
        "AAAAAAAAAIBUaXRpcGVyIGxvY2tzIFhMTSBpbnRvIHRoaXMgY29udHJhY3QuClJlcXVpcmVzIEZyZWlnaHRlciBzaWduYXR1cmUgZnJvbSB0aGUgdGl0aXBlci4KVG9rZW4gaXMgdHJhbnNmZXJyZWQ6IHRpdGlwZXIg4oaSIGNvbnRyYWN0LgAAAAxmdW5kX3JlcXVlc3QAAAACAAAAAAAAAApyZXF1ZXN0X2lkAAAAAAAQAAAAAAAAAAd0aXRpcGVyAAAAABMAAAAA",
        "AAAAAAAAALZSdW5uZXIgcmVnaXN0ZXJzIGFuIGVzY3JvdyByZXF1ZXN0IGFmdGVyIGFwcHJvdmluZyB0aGUgdGl0aXBlcidzIGl0ZW0uCkxvY2tzIGluIHRoZSB0ZXJtczogd2hvIHBheXMsIHdobyByZWNlaXZlcywgaG93IG11Y2guCk11c3QgYmUgY2FsbGVkIGJ5IHRoZSBydW5uZXIgYmVmb3JlIHRoZSB0aXRpcGVyIGNhbiBmdW5kLgAAAAAADmNyZWF0ZV9yZXF1ZXN0AAAAAAAFAAAAAAAAAApyZXF1ZXN0X2lkAAAAAAAQAAAAAAAAAAZydW5uZXIAAAAAABMAAAAAAAAAB3RpdGlwZXIAAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAAJZSdW5uZXIgbWFya3MgdGhlIGl0ZW0gYXMgdW5hdmFpbGFibGUgKHNvbGQgb3V0LCB0cmlwIGNhbmNlbGVkLCBldGMpLgpBdXRvbWF0aWNhbGx5IHJlZnVuZHMgZnVuZHM6IGNvbnRyYWN0IOKGkiB0aXRpcGVyLgpPbmx5IHRoZSBydW5uZXIgY2FuIGNhbGwgdGhpcy4AAAAAAA5yZWZ1bmRfcmVxdWVzdAAAAAAAAgAAAAAAAAAKcmVxdWVzdF9pZAAAAAAAEAAAAAAAAAAGcnVubmVyAAAAAAATAAAAAQAAABA=",
        "AAAAAAAAAHtUaXRpcGVyIGNvbmZpcm1zIHRoZXkgcmVjZWl2ZWQgdGhlIGl0ZW0uCkF1dG9tYXRpY2FsbHkgcmVsZWFzZXMgZnVuZHM6IGNvbnRyYWN0IOKGkiBydW5uZXIuCk9ubHkgdGhlIHRpdGlwZXIgY2FuIGNhbGwgdGhpcy4AAAAAD2NvbmZpcm1fcmVjZWlwdAAAAAACAAAAAAAAAApyZXF1ZXN0X2lkAAAAAAAQAAAAAAAAAAd0aXRpcGVyAAAAABMAAAABAAAAEA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_request: this.txFromJSON<EscrowRequest>,
        fund_request: this.txFromJSON<null>,
        create_request: this.txFromJSON<null>,
        refund_request: this.txFromJSON<string>,
        confirm_receipt: this.txFromJSON<string>
  }
}