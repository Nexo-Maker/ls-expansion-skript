/**
 * Skript text: string literals, and the variable tokens editors write into values (`<player.name>`)
 * turned into `%expressions%`.
 */

import { TOKENS } from './tokens'

/** Skript's own formatting tags, which pass through a string untouched: `<red>`, `<bold>`, `<#ff0000>`. */
const FORMAT_TAGS = new Set([
  'black', 'dark_blue', 'dark_green', 'dark_aqua', 'dark_cyan', 'dark_red', 'dark_purple', 'gold', 'orange', 'gray', 'grey',
  'light_gray', 'dark_gray', 'dark_grey', 'blue', 'green', 'aqua', 'cyan', 'red', 'light_purple', 'pink', 'magenta', 'yellow', 'white',
  'bold', 'b', 'italic', 'i', 'underlined', 'u', 'strikethrough', 's', 'obfuscated', 'magic', 'reset', 'r', 'shift', 'glyph'
])

export interface TextOptions {
  /** The Skript expression a token stands for, or undefined when it has none */
  resolve: (token: string) => string | undefined
  /** Called with each token that has no Skript expression (left in the text as written) */
  onUnknown?: (token: string) => void
}

/** A quoted Skript string of plain text: `"` doubled, `%` doubled, nothing interpreted. */
export function quote(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""').replace(/%/g, '%%')}"`
}

/** Expressions that are already text: Skript refuses them alone inside a string (`"%name of x%"`). */
const TEXT_EXPRESSION = /^(name of |uuid of |ip of |message$|command$|motd$|minecraft version$|random uuid$|nl$|""$)/

/**
 * A quoted Skript string of user text, its variable tokens as `%expressions%`:
 * `text('Hi <player.name>!', ...)` -> `"Hi %player%!"`. Formatting tags (`<red>`) pass through.
 * A value that is a single text expression and nothing else is written bare (`name of world of
 * player`), as Skript requires.
 */
export function text(value: unknown, { resolve, onUnknown }: TextOptions): string {
  const only = /^<([^<>\s]+)>$/.exec(String(value ?? '').trim())?.[1]
  const alone = only ? resolve(only) : undefined
  if (alone && TEXT_EXPRESSION.test(alone)) return alone
  const escaped = String(value ?? '').replace(/"/g, '""').replace(/%/g, '%%')
  return `"${escaped.replace(/<([^<>\s]+)>/g, (whole, token: string) => {
    const expr = resolve(token)
    if (expr === '""') return ''
    if (expr !== undefined) return `%${expr}%`
    const name = token.split(':')[0].replace(/^\//, '').toLowerCase()
    if (!FORMAT_TAGS.has(name) && !name.startsWith('#')) onUnknown?.(token)
    return whole
  })}"`
}

/**
 * A resolver over the default token table, for a context: `player` is the Skript expression for
 * the player there (`player` in a player event, `{_p}` in a function), or null when the context has
 * no player (a world event), in which case player tokens are unknown.
 */
export function tokenResolver(player: string | null, extra: Record<string, string> = {}) {
  return (token: string): string | undefined => {
    const template = extra[token] ?? TOKENS[token]
    if (template === undefined) return undefined
    if (template.includes('{p}')) return player === null ? undefined : template.replace(/\{p\}/g, player)
    return template
  }
}

/**
 * A value used as an object (a target, a location, a list), not as text: `player`, `<player>`,
 * `<context.entity>`, `nearest`. Returns the Skript expression, or undefined when there is none.
 */
export function reference(value: unknown, resolve: (token: string) => string | undefined): string | undefined {
  const v = String(value ?? '').trim()
  if (!v) return undefined
  const token = /^<([^<>\s]+)>$/.exec(v)?.[1] ?? (/^(player|context|server|util)(\.|$)/.test(v) ? v : null)
  if (token) return resolve(token)
  return undefined
}
