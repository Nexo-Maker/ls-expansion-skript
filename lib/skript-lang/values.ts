/**
 * Skript values: item names, durations, numbers, identifiers.
 */

/** A vanilla item or block id as Skript names it: `minecraft:diamond_sword` -> `diamond sword`. */
export function itemName(id: string): string {
  return String(id || 'stone')
    .trim()
    .toLowerCase()
    .replace(/^minecraft:/, '')
    .replace(/_/g, ' ')
}

/** An entity type id as Skript names it: `ZOMBIE_VILLAGER` -> `zombie villager`. */
export const entityName = itemName

/**
 * A duration as Skript writes it. Accepts what the editors save: `10s`, `20t`, `5m`, `1h`, `2d`, or
 * a bare number of seconds.
 */
export function timespan(value: unknown, fallback = '1 second'): string {
  const m = /^(\d+(?:\.\d+)?)\s*([tsmhd])?$/i.exec(String(value ?? '').trim())
  if (!m) return fallback
  const unit = ({ t: 'tick', s: 'second', m: 'minute', h: 'hour', d: 'day' } as Record<string, string>)[(m[2] || 's').toLowerCase()]
  return `${m[1]} ${unit}${Number(m[1]) === 1 ? '' : 's'}`
}

/** A number, or `fallback` when the value is empty or not one. */
export function number(value: unknown, fallback: number): number {
  const n = Number(value)
  return String(value ?? '').trim() !== '' && Number.isFinite(n) ? n : fallback
}

/** A whole number at least `min`. */
export function count(value: unknown, fallback: number, min = 1): number {
  return Math.max(min, Math.round(number(value, fallback)))
}

/** A name safe in a Skript function or variable name: letters, digits and `_`. */
export function ident(name: unknown): string {
  const safe = String(name ?? '')
    .trim()
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/_+/g, '_')
  return /^[A-Za-z_]/.test(safe) ? safe : `x_${safe}`
}

/** A Bukkit sound name as Skript plays it (Skript takes the enum name, `UI_BUTTON_CLICK`). */
export function sound(name: unknown, fallback = 'UI_BUTTON_CLICK'): string {
  return String(name || fallback).trim().toUpperCase().replace(/[.\s]/g, '_')
}
