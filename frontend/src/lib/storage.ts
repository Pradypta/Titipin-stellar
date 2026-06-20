/**
 * Shared storage layer backed by Supabase.
 * Visible across every browser profile, device, and Chrome account.
 */

import { supabase } from './supabase'
import type { TitipGroup } from '../types/group'
import type { TitipRequest, TitipRequestStatus } from '../types/request'


// ── Column mappers ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toGroup(row: any): TitipGroup {
  return {
    groupId:               row.group_id,
    runnerAddress:         row.runner_address,
    title:                 row.title,
    sourceLocation:        row.source_location,
    description:           row.description,
    openUntil:             row.open_until,
    estimatedPurchaseDate: row.estimated_purchase_date,
    estimatedDeliveryDate: row.estimated_delivery_date,
    groupStatus:           row.group_status,
    feePercentage:         row.fee_percentage,
    createdAt:             row.created_at,
  }
}

function fromGroup(g: TitipGroup) {
  return {
    group_id:                g.groupId,
    runner_address:          g.runnerAddress,
    title:                   g.title,
    source_location:         g.sourceLocation,
    description:             g.description,
    open_until:              g.openUntil,
    estimated_purchase_date: g.estimatedPurchaseDate,
    estimated_delivery_date: g.estimatedDeliveryDate,
    group_status:            g.groupStatus,
    fee_percentage:          g.feePercentage,
    created_at:              g.createdAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRequest(row: any): TitipRequest {
  return {
    requestId:      row.request_id,
    groupId:        row.group_id,
    titiperAddress: row.titiper_address,
    runnerAddress:  row.runner_address,
    itemName:       row.item_name,
    itemLink:       row.item_link,
    variant:        row.variant,
    quantity:       row.quantity,
    notes:          row.notes,
    estimatedPrice: row.estimated_price,
    runnerQuote:      row.runner_quote,
    requestStatus:    row.request_status,
    createdAt:        row.created_at,
    statusUpdatedAt:  row.status_updated_at ?? null,
  }
}

function fromRequest(r: TitipRequest) {
  return {
    request_id:         r.requestId,
    group_id:           r.groupId,
    titiper_address:    r.titiperAddress,
    runner_address:     r.runnerAddress,
    item_name:          r.itemName,
    item_link:          r.itemLink,
    variant:            r.variant,
    quantity:           r.quantity,
    notes:              r.notes,
    estimated_price:    r.estimatedPrice,
    runner_quote:       r.runnerQuote,
    request_status:     r.requestStatus,
    created_at:         r.createdAt,
    status_updated_at:  r.statusUpdatedAt,
  }
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function saveGroup(group: TitipGroup): Promise<void> {
  const { error } = await supabase.from('titipin_groups').upsert(fromGroup(group))
  if (error) throw new Error(error.message)
}

export async function getOpenGroups(): Promise<TitipGroup[]> {
  const { data, error } = await supabase
    .from('titipin_groups')
    .select('*')
    .eq('group_status', 'open')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toGroup)
}

export async function getGroupById(groupId: string): Promise<TitipGroup | null> {
  const { data, error } = await supabase
    .from('titipin_groups')
    .select('*')
    .eq('group_id', groupId)
    .single()
  if (error) return null
  return toGroup(data)
}

export async function getGroupsByRunner(runnerAddress: string): Promise<TitipGroup[]> {
  const { data, error } = await supabase
    .from('titipin_groups')
    .select('*')
    .eq('runner_address', runnerAddress)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toGroup)
}

export async function updateGroupStatus(
  groupId: string,
  status: TitipGroup['groupStatus'],
): Promise<void> {
  const { error } = await supabase
    .from('titipin_groups')
    .update({ group_status: status })
    .eq('group_id', groupId)
  if (error) throw new Error(error.message)
}

// ── Requests ──────────────────────────────────────────────────────────────────

export async function saveRequest(request: TitipRequest): Promise<void> {
  const { error } = await supabase.from('titipin_requests').upsert(fromRequest(request))
  if (error) throw new Error(error.message)
}

export async function getRequestById(requestId: string): Promise<TitipRequest | null> {
  const { data, error } = await supabase
    .from('titipin_requests')
    .select('*')
    .eq('request_id', requestId)
    .single()
  if (error) return null
  return toRequest(data)
}

export async function getRequestsByRunner(runnerAddress: string): Promise<TitipRequest[]> {
  const { data, error } = await supabase
    .from('titipin_requests')
    .select('*')
    .eq('runner_address', runnerAddress)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toRequest)
}

export async function getRequestsByGroup(groupId: string): Promise<TitipRequest[]> {
  const { data, error } = await supabase
    .from('titipin_requests')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toRequest)
}

export async function getRequestsByTitiper(titiperAddress: string): Promise<TitipRequest[]> {
  const { data, error } = await supabase
    .from('titipin_requests')
    .select('*')
    .eq('titiper_address', titiperAddress)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toRequest)
}

export async function approveRequest(
  requestId: string,
  runnerQuote: number,
): Promise<void> {
  const { error } = await supabase
    .from('titipin_requests')
    .update({
      runner_quote:      runnerQuote,
      request_status:    'approved_waiting_payment',
      status_updated_at: new Date().toISOString(),
    })
    .eq('request_id', requestId)
  if (error) throw new Error(error.message)
}

export async function updateRequestStatus(
  requestId: string,
  status: TitipRequestStatus,
): Promise<void> {
  const { error } = await supabase
    .from('titipin_requests')
    .update({
      request_status:    status,
      status_updated_at: new Date().toISOString(),
    })
    .eq('request_id', requestId)
  if (error) throw new Error(error.message)
}

export async function rejectRequest(requestId: string): Promise<void> {
  return updateRequestStatus(requestId, 'unavailable')
}

/** Auto-complete shipped requests older than `days` days. */
export async function autoCompleteIfExpired(
  requestId: string,
  statusUpdatedAt: string | null,
  days = 3,
): Promise<boolean> {
  if (!statusUpdatedAt) return false
  const elapsed = Date.now() - new Date(statusUpdatedAt).getTime()
  if (elapsed < days * 24 * 60 * 60 * 1000) return false
  await updateRequestStatus(requestId, 'completed')
  return true
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
