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
    contractId: "CAB5LP5SKD22NA6SECD6EV3AJ62BWYV5MNRRELCHVKF5DX6IUQADSXBB",
  }
} as const

export type DataKey = {tag: "Request", values: readonly [string]} | {tag: "Admin", values: void} | {tag: "ReputationContract", values: void};

export type EscrowStatus = {tag: "Registered", values: void} | {tag: "Funded", values: void} | {tag: "Shipped", values: void} | {tag: "Delivered", values: void} | {tag: "Completed", values: void} | {tag: "Refunded", values: void};


export interface EscrowRequest {
  amount: i128;
  delivered_at: u64;
  funded_at: u64;
  runner: string;
  shipped_at: u64;
  status: EscrowStatus;
  titiper: string;
  token: string;
  tracking: string;
}

export interface Client {
  /**
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Upgrade the contract WASM in-place (same contract ID, new logic).
   * Only the admin set in initialize() can call this.
   */
  upgrade: ({new_wasm_hash}: {new_wasm_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Call once after deploy to register the admin address.
   * Admin is the only one who can upgrade the contract WASM.
   */
  initialize: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_request transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read-only: current on-chain state of a request.
   */
  get_request: ({request_id}: {request_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<EscrowRequest>>

  /**
   * Construct and simulate a fund_request transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Titiper locks funds into this contract.
   * Token is transferred: titiper → contract.
   */
  fund_request: ({request_id, titiper}: {request_id: string, titiper: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a mark_shipped transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Runner marks the item purchased + shipped and records the courier
   * tracking number. Moves the escrow from Funded → Shipped.
   */
  mark_shipped: ({request_id, runner, tracking}: {request_id: string, runner: string, tracking: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a create_request transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Runner registers an escrow request after approving the titiper's item.
   */
  create_request: ({request_id, runner, titiper, token, amount}: {request_id: string, runner: string, titiper: string, token: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a mark_delivered transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Courier oracle (the admin/backend) confirms the parcel was delivered.
   * Moves Shipped → Delivered and starts the 72h auto-release clock.
   */
  mark_delivered: ({request_id}: {request_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a refund_request transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Runner marks item unavailable — refunds titiper.
   */
  refund_request: ({request_id, runner}: {request_id: string, runner: string}, options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a confirm_receipt transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Titiper confirms receipt — releases funds to runner and rates them.
   * Allowed any time after funding (Funded, Shipped, or Delivered).
   * `rating` is a 1..=5 star score for the runner; pass 0 to skip rating.
   * Rating never blocks the payout — it is recorded alongside it.
   */
  confirm_receipt: ({request_id, titiper, rating}: {request_id: string, titiper: string, rating: u32}, options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a claim_auto_release transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Auto-release protection for the runner: once 72h have passed since the
   * courier marked the parcel delivered and the titiper still hasn't
   * confirmed, anyone (a keeper/cron) can trigger payout to the runner.
   * Permissionless — funds can only ever go to the pre-agreed runner.
   */
  claim_auto_release: ({request_id}: {request_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a claim_timeout_refund transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Escape hatch: titiper reclaims funds if runner ghosts for 30 days.
   * Protects titipers from runners who disappear after escrow is funded.
   */
  claim_timeout_refund: ({request_id, titiper}: {request_id: string, titiper: string}, options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a set_reputation_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin registers the reputation contract address for cross-contract calls.
   */
  set_reputation_contract: ({reputation_id}: {reputation_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

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
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAEAAAAAAAAAB1JlcXVlc3QAAAAAAQAAABAAAAAAAAAAAAAAAAVBZG1pbgAAAAAAAAAAAAAAAAAAElJlcHV0YXRpb25Db250cmFjdAAA",
        "AAAAAgAAAAAAAAAAAAAADEVzY3Jvd1N0YXR1cwAAAAYAAAAAAAAAAAAAAApSZWdpc3RlcmVkAAAAAAAAAAAAAAAAAAZGdW5kZWQAAAAAAAAAAAAAAAAAB1NoaXBwZWQAAAAAAAAAAAAAAAAJRGVsaXZlcmVkAAAAAAAAAAAAAAAAAAAJQ29tcGxldGVkAAAAAAAAAAAAAAAAAAAIUmVmdW5kZWQ=",
        "AAAAAQAAAAAAAAAAAAAADUVzY3Jvd1JlcXVlc3QAAAAAAAAJAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAADGRlbGl2ZXJlZF9hdAAAAAYAAAAAAAAACWZ1bmRlZF9hdAAAAAAAAAYAAAAAAAAABnJ1bm5lcgAAAAAAEwAAAAAAAAAKc2hpcHBlZF9hdAAAAAAABgAAAAAAAAAGc3RhdHVzAAAAAAfQAAAADEVzY3Jvd1N0YXR1cwAAAAAAAAAHdGl0aXBlcgAAAAATAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAAAAAACHRyYWNraW5nAAAAEA==",
        "AAAAAAAAAHNVcGdyYWRlIHRoZSBjb250cmFjdCBXQVNNIGluLXBsYWNlIChzYW1lIGNvbnRyYWN0IElELCBuZXcgbG9naWMpLgpPbmx5IHRoZSBhZG1pbiBzZXQgaW4gaW5pdGlhbGl6ZSgpIGNhbiBjYWxsIHRoaXMuAAAAAAd1cGdyYWRlAAAAAAEAAAAAAAAADW5ld193YXNtX2hhc2gAAAAAAAPuAAAAIAAAAAA=",
        "AAAAAAAAAG5DYWxsIG9uY2UgYWZ0ZXIgZGVwbG95IHRvIHJlZ2lzdGVyIHRoZSBhZG1pbiBhZGRyZXNzLgpBZG1pbiBpcyB0aGUgb25seSBvbmUgd2hvIGNhbiB1cGdyYWRlIHRoZSBjb250cmFjdCBXQVNNLgAAAAAACmluaXRpYWxpemUAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAC9SZWFkLW9ubHk6IGN1cnJlbnQgb24tY2hhaW4gc3RhdGUgb2YgYSByZXF1ZXN0LgAAAAALZ2V0X3JlcXVlc3QAAAAAAQAAAAAAAAAKcmVxdWVzdF9pZAAAAAAAEAAAAAEAAAfQAAAADUVzY3Jvd1JlcXVlc3QAAAA=",
        "AAAAAAAAAFNUaXRpcGVyIGxvY2tzIGZ1bmRzIGludG8gdGhpcyBjb250cmFjdC4KVG9rZW4gaXMgdHJhbnNmZXJyZWQ6IHRpdGlwZXIg4oaSIGNvbnRyYWN0LgAAAAAMZnVuZF9yZXF1ZXN0AAAAAgAAAAAAAAAKcmVxdWVzdF9pZAAAAAAAEAAAAAAAAAAHdGl0aXBlcgAAAAATAAAAAA==",
        "AAAAAAAAAHxSdW5uZXIgbWFya3MgdGhlIGl0ZW0gcHVyY2hhc2VkICsgc2hpcHBlZCBhbmQgcmVjb3JkcyB0aGUgY291cmllcgp0cmFja2luZyBudW1iZXIuIE1vdmVzIHRoZSBlc2Nyb3cgZnJvbSBGdW5kZWQg4oaSIFNoaXBwZWQuAAAADG1hcmtfc2hpcHBlZAAAAAMAAAAAAAAACnJlcXVlc3RfaWQAAAAAABAAAAAAAAAABnJ1bm5lcgAAAAAAEwAAAAAAAAAIdHJhY2tpbmcAAAAQAAAAAA==",
        "AAAAAAAAAEZSdW5uZXIgcmVnaXN0ZXJzIGFuIGVzY3JvdyByZXF1ZXN0IGFmdGVyIGFwcHJvdmluZyB0aGUgdGl0aXBlcidzIGl0ZW0uAAAAAAAOY3JlYXRlX3JlcXVlc3QAAAAAAAUAAAAAAAAACnJlcXVlc3RfaWQAAAAAABAAAAAAAAAABnJ1bm5lcgAAAAAAEwAAAAAAAAAHdGl0aXBlcgAAAAATAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
        "AAAAAAAAAIhDb3VyaWVyIG9yYWNsZSAodGhlIGFkbWluL2JhY2tlbmQpIGNvbmZpcm1zIHRoZSBwYXJjZWwgd2FzIGRlbGl2ZXJlZC4KTW92ZXMgU2hpcHBlZCDihpIgRGVsaXZlcmVkIGFuZCBzdGFydHMgdGhlIDcyaCBhdXRvLXJlbGVhc2UgY2xvY2suAAAADm1hcmtfZGVsaXZlcmVkAAAAAAABAAAAAAAAAApyZXF1ZXN0X2lkAAAAAAAQAAAAAA==",
        "AAAAAAAAADJSdW5uZXIgbWFya3MgaXRlbSB1bmF2YWlsYWJsZSDigJQgcmVmdW5kcyB0aXRpcGVyLgAAAAAADnJlZnVuZF9yZXF1ZXN0AAAAAAACAAAAAAAAAApyZXF1ZXN0X2lkAAAAAAAQAAAAAAAAAAZydW5uZXIAAAAAABMAAAABAAAAEA==",
        "AAAAAAAAAQtUaXRpcGVyIGNvbmZpcm1zIHJlY2VpcHQg4oCUIHJlbGVhc2VzIGZ1bmRzIHRvIHJ1bm5lciBhbmQgcmF0ZXMgdGhlbS4KQWxsb3dlZCBhbnkgdGltZSBhZnRlciBmdW5kaW5nIChGdW5kZWQsIFNoaXBwZWQsIG9yIERlbGl2ZXJlZCkuCmByYXRpbmdgIGlzIGEgMS4uPTUgc3RhciBzY29yZSBmb3IgdGhlIHJ1bm5lcjsgcGFzcyAwIHRvIHNraXAgcmF0aW5nLgpSYXRpbmcgbmV2ZXIgYmxvY2tzIHRoZSBwYXlvdXQg4oCUIGl0IGlzIHJlY29yZGVkIGFsb25nc2lkZSBpdC4AAAAAD2NvbmZpcm1fcmVjZWlwdAAAAAADAAAAAAAAAApyZXF1ZXN0X2lkAAAAAAAQAAAAAAAAAAd0aXRpcGVyAAAAABMAAAAAAAAABnJhdGluZwAAAAAABAAAAAEAAAAQ",
        "AAAAAAAAAQ9BdXRvLXJlbGVhc2UgcHJvdGVjdGlvbiBmb3IgdGhlIHJ1bm5lcjogb25jZSA3MmggaGF2ZSBwYXNzZWQgc2luY2UgdGhlCmNvdXJpZXIgbWFya2VkIHRoZSBwYXJjZWwgZGVsaXZlcmVkIGFuZCB0aGUgdGl0aXBlciBzdGlsbCBoYXNuJ3QKY29uZmlybWVkLCBhbnlvbmUgKGEga2VlcGVyL2Nyb24pIGNhbiB0cmlnZ2VyIHBheW91dCB0byB0aGUgcnVubmVyLgpQZXJtaXNzaW9ubGVzcyDigJQgZnVuZHMgY2FuIG9ubHkgZXZlciBnbyB0byB0aGUgcHJlLWFncmVlZCBydW5uZXIuAAAAABJjbGFpbV9hdXRvX3JlbGVhc2UAAAAAAAEAAAAAAAAACnJlcXVlc3RfaWQAAAAAABAAAAABAAAAEA==",
        "AAAAAAAAAIdFc2NhcGUgaGF0Y2g6IHRpdGlwZXIgcmVjbGFpbXMgZnVuZHMgaWYgcnVubmVyIGdob3N0cyBmb3IgMzAgZGF5cy4KUHJvdGVjdHMgdGl0aXBlcnMgZnJvbSBydW5uZXJzIHdobyBkaXNhcHBlYXIgYWZ0ZXIgZXNjcm93IGlzIGZ1bmRlZC4AAAAAFGNsYWltX3RpbWVvdXRfcmVmdW5kAAAAAgAAAAAAAAAKcmVxdWVzdF9pZAAAAAAAEAAAAAAAAAAHdGl0aXBlcgAAAAATAAAAAQAAABA=",
        "AAAAAAAAAElBZG1pbiByZWdpc3RlcnMgdGhlIHJlcHV0YXRpb24gY29udHJhY3QgYWRkcmVzcyBmb3IgY3Jvc3MtY29udHJhY3QgY2FsbHMuAAAAAAAAF3NldF9yZXB1dGF0aW9uX2NvbnRyYWN0AAAAAAEAAAAAAAAADXJlcHV0YXRpb25faWQAAAAAAAATAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    upgrade: this.txFromJSON<null>,
        initialize: this.txFromJSON<null>,
        get_request: this.txFromJSON<EscrowRequest>,
        fund_request: this.txFromJSON<null>,
        mark_shipped: this.txFromJSON<null>,
        create_request: this.txFromJSON<null>,
        mark_delivered: this.txFromJSON<null>,
        refund_request: this.txFromJSON<string>,
        confirm_receipt: this.txFromJSON<string>,
        claim_auto_release: this.txFromJSON<string>,
        claim_timeout_refund: this.txFromJSON<string>,
        set_reputation_contract: this.txFromJSON<null>
  }
}