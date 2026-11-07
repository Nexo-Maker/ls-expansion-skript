/**
 * What a spelling has to hand while it writes one step: who "the player" is here, how variables
 * read, and the project's content plugin. A spelling that cannot write its step throws
 * `Unspellable`; the step walker turns that into a comment in the file and a warning.
 */

import { itemRef, type Report } from 'target-kit'
import { itemName, quote, reference, text, tokenResolver } from 'skript-lang'

export class Unspellable extends Error {}

export interface Ctx {
  /** The Skript expression for the player here, or null (a world event) */
  player: string | null
  /** The content plugin custom items come from ('nexo', 'itemsadder', ...) */
  contentPlugin: string
  /** GUI ids in the project, for opening them */
  guis: Set<string>
  /** Whether `cancel event` is allowed here (Skript refuses it in some events). Default true. */
  cancellable?: boolean
  report: Report
  /** Token -> Skript expression in this context */
  resolve: (token: string) => string | undefined
}

export function createCtx(base: Omit<Ctx, 'resolve'>, tokens: Record<string, string> = {}): Ctx {
  return { ...base, resolve: tokenResolver(base.player, tokens) }
}

/** The player, or Unspellable when this context has none. */
export function playerOf(ctx: Ctx): string {
  if (ctx.player === null) throw new Unspellable('needs a player, and this trigger has none')
  return ctx.player
}

/** User text as a Skript string, its variables as %expressions%. */
export function say(ctx: Ctx, value: unknown): string {
  return text(value, { resolve: ctx.resolve, onUnknown: (t) => ctx.report.warn(`no Skript expression for the variable <${t}>, left as text`) })
}

/**
 * A param meant as an object (`target`, `player`, `location`): the player when empty or "player",
 * a variable's expression, `nearest player`. `fallback` is used when empty.
 */
export function ref(ctx: Ctx, value: unknown, fallback: () => string): string {
  const v = String(value ?? '').trim()
  if (!v || v === 'player' || v === '<player>') return v ? playerOf(ctx) : fallback()
  if (v === 'nearest') return `nearest player`
  const expr = reference(v, ctx.resolve)
  if (expr) return expr
  if (/^</.test(v) || /^(player|context|server|util)\./.test(v)) throw new Unspellable(`no Skript expression for ${v}`)
  return v
}

/** A vanilla item for Skript; a content plugin's item is Unspellable (plain Skript cannot match it). */
export function vanillaItem(value: unknown, fallback = 'stone'): string {
  const { custom, id } = itemRef(value, fallback)
  if (custom) throw new Unspellable(`"${id}" is a custom item, which plain Skript cannot check or place`)
  return itemName(id)
}

/**
 * Lines that give `amount` of an item to `player`: vanilla items with `give`, custom items through
 * the content plugin's own give command.
 */
export function giveLines(ctx: Ctx, value: unknown, amount: number, player: string): string[] {
  const { custom, id } = itemRef(value, 'diamond')
  if (!custom) return [`give ${amount} of ${itemName(id)} to ${player}`]
  const commands: Record<string, string> = {
    nexo: `nexo give %${player}% ${id} ${amount}`,
    itemsadder: `iagive %${player}% ${id} ${amount}`
  }
  const command = commands[ctx.contentPlugin]
  if (!command) throw new Unspellable(`giving custom items from ${ctx.contentPlugin} is not supported`)
  return [`execute console command "${command.replace(/"/g, '""')}"`]
}

export { quote }
