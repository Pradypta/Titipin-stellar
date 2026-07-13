// @ts-nocheck — auto-generated Soroban contract bindings; regenerated via `stellar contract bindings typescript`
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
    contractId: "CBYNRRNW7RE5WJXJSNGPY45SAWTXU6GWGQ42PJSV4VT35MK6PIHXNJTK",
  }
} as const

export type DataKey = {tag: "Stats", values: readonly [string]} | {tag: "Admin", values: void};


export interface RunnerStats {
  completed: u32;
  rating_count: u32;
  rating_sum: u64;
  refunded: u32;
}

export interface Client {
  /**
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Upgrade the contract WASM in-place (same contract ID, new logic).
   * Only the admin set in initialize() can call this.
   */
  upgrade: ({new_wasm_hash}: {new_wasm_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_stats transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns completed/refunded counts and rating totals for a runner.
   * Returns zeros if no history. Average rating = rating_sum / rating_count
   * (computed by the caller to avoid on-chain fixed-point).
   */
  get_stats: ({runner}: {runner: string}, options?: MethodOptions) => Promise<AssembledTransaction<RunnerStats>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Call once after deploy to register the admin address.
   * Admin is the only one who can upgrade the contract WASM.
   */
  initialize: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a record_refunded transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Called by the escrow contract when a runner issues a refund.
   */
  record_refunded: ({runner}: {runner: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a record_completed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Called by the escrow contract when a titiper confirms receipt.
   * `rating` is a 1..=5 star score; 0 means the titiper skipped rating
   * (e.g. permissionless auto-release), and out-of-range values are ignored.
   * A completion is always counted regardless of whether a rating was given.
   */
  record_completed: ({runner, rating}: {runner: string, rating: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

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
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAEAAAAAAAAABVN0YXRzAAAAAAAAAQAAABMAAAAAAAAAAAAAAAVBZG1pbgAAAA==",
        "AAAAAQAAAAAAAAAAAAAAC1J1bm5lclN0YXRzAAAAAAQAAAAAAAAACWNvbXBsZXRlZAAAAAAAAAQAAAAAAAAADHJhdGluZ19jb3VudAAAAAQAAAAAAAAACnJhdGluZ19zdW0AAAAAAAYAAAAAAAAACHJlZnVuZGVkAAAABA==",
        "AAAAAAAAAHNVcGdyYWRlIHRoZSBjb250cmFjdCBXQVNNIGluLXBsYWNlIChzYW1lIGNvbnRyYWN0IElELCBuZXcgbG9naWMpLgpPbmx5IHRoZSBhZG1pbiBzZXQgaW4gaW5pdGlhbGl6ZSgpIGNhbiBjYWxsIHRoaXMuAAAAAAd1cGdyYWRlAAAAAAEAAAAAAAAADW5ld193YXNtX2hhc2gAAAAAAAPuAAAAIAAAAAA=",
        "AAAAAAAAAMFSZXR1cm5zIGNvbXBsZXRlZC9yZWZ1bmRlZCBjb3VudHMgYW5kIHJhdGluZyB0b3RhbHMgZm9yIGEgcnVubmVyLgpSZXR1cm5zIHplcm9zIGlmIG5vIGhpc3RvcnkuIEF2ZXJhZ2UgcmF0aW5nID0gcmF0aW5nX3N1bSAvIHJhdGluZ19jb3VudAooY29tcHV0ZWQgYnkgdGhlIGNhbGxlciB0byBhdm9pZCBvbi1jaGFpbiBmaXhlZC1wb2ludCkuAAAAAAAACWdldF9zdGF0cwAAAAAAAAEAAAAAAAAABnJ1bm5lcgAAAAAAEwAAAAEAAAfQAAAAC1J1bm5lclN0YXRzAA==",
        "AAAAAAAAAG5DYWxsIG9uY2UgYWZ0ZXIgZGVwbG95IHRvIHJlZ2lzdGVyIHRoZSBhZG1pbiBhZGRyZXNzLgpBZG1pbiBpcyB0aGUgb25seSBvbmUgd2hvIGNhbiB1cGdyYWRlIHRoZSBjb250cmFjdCBXQVNNLgAAAAAACmluaXRpYWxpemUAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAADxDYWxsZWQgYnkgdGhlIGVzY3JvdyBjb250cmFjdCB3aGVuIGEgcnVubmVyIGlzc3VlcyBhIHJlZnVuZC4AAAAPcmVjb3JkX3JlZnVuZGVkAAAAAAEAAAAAAAAABnJ1bm5lcgAAAAAAEwAAAAA=",
        "AAAAAAAAARNDYWxsZWQgYnkgdGhlIGVzY3JvdyBjb250cmFjdCB3aGVuIGEgdGl0aXBlciBjb25maXJtcyByZWNlaXB0LgpgcmF0aW5nYCBpcyBhIDEuLj01IHN0YXIgc2NvcmU7IDAgbWVhbnMgdGhlIHRpdGlwZXIgc2tpcHBlZCByYXRpbmcKKGUuZy4gcGVybWlzc2lvbmxlc3MgYXV0by1yZWxlYXNlKSwgYW5kIG91dC1vZi1yYW5nZSB2YWx1ZXMgYXJlIGlnbm9yZWQuCkEgY29tcGxldGlvbiBpcyBhbHdheXMgY291bnRlZCByZWdhcmRsZXNzIG9mIHdoZXRoZXIgYSByYXRpbmcgd2FzIGdpdmVuLgAAAAAQcmVjb3JkX2NvbXBsZXRlZAAAAAIAAAAAAAAABnJ1bm5lcgAAAAAAEwAAAAAAAAAGcmF0aW5nAAAAAAAEAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    upgrade: this.txFromJSON<null>,
        get_stats: this.txFromJSON<RunnerStats>,
        initialize: this.txFromJSON<null>,
        record_refunded: this.txFromJSON<null>,
        record_completed: this.txFromJSON<null>
  }
}