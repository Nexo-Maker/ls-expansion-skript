/**
 * Spelling tables: one entry per thing the editors offer, and the one place a target decides what
 * each becomes. A step is spelled from the target's own table first, then from the catalog entry's
 * `targets[targetId]` template (entries other expansions add), and otherwise reported.
 *
 *   const actions = spellings<Ctx, string[]>({
 *     Narrate: (p, ctx) => [`send ${ctx.text(p.message)} to player`]
 *   })
 *   actions.spell(step, ctx, { targetId: 'skript', entry: catalog.mechanics.actions[step.command] })
 *
 * `coverage(catalogSection)` lists what the catalog has and the table does not: a target's to-do
 * list, and something to show users.
 */

import { fillLines } from './templates'
import type { Params, Step } from './types'

export type Spell<Ctx, Out> = (params: Params, ctx: Ctx, step: Step) => Out

export interface SpellOptions {
  targetId: string
  /** The catalog entry for the step's command, for expansions' entries */
  entry?: any
}

export type SpellResult<Out> =
  | { ok: true; value: Out; from: 'table' }
  | { ok: true; value: string[]; from: 'template' }
  | { ok: false; reason: string }

export interface SpellingTable<Ctx, Out> {
  readonly entries: Readonly<Record<string, Spell<Ctx, Out>>>
  has(command: string): boolean
  /** The step spelled: by the table, else by the entry's template for `targetId`. */
  spell(step: Step, ctx: Ctx, options: SpellOptions): SpellResult<Out>
  /** What `section` (e.g. `catalog.mechanics.actions`) has that this table and the templates do not. */
  coverage(section: Record<string, any>, targetId: string, filter?: (key: string, entry: any) => boolean): { spelled: string[]; missing: string[] }
}

export function spellings<Ctx, Out>(entries: Record<string, Spell<Ctx, Out>>): SpellingTable<Ctx, Out> {
  return {
    entries,
    has: (command) => Object.prototype.hasOwnProperty.call(entries, command),
    spell(step, ctx, { targetId, entry }) {
      const own = entries[step.command]
      if (own) return { ok: true, value: own(step.params, ctx, step), from: 'table' }
      const template = entry?.targets?.[targetId]
      if (template) return { ok: true, value: fillLines(template, step.params), from: 'template' }
      return { ok: false, reason: `"${entry?.label || step.command}" has no ${targetId} spelling` }
    },
    coverage(section, targetId, filter = () => true) {
      const spelled: string[] = []
      const missing: string[] = []
      for (const [key, entry] of Object.entries(section || {})) {
        if (!filter(key, entry)) continue
        if (entries[key] || entry?.targets?.[targetId]) spelled.push(key)
        else missing.push(key)
      }
      return { spelled, missing }
    }
  }
}

/** Every step of a program, flat, in order. */
export function walkSteps(steps: Step[], out: Step[] = []): Step[] {
  for (const step of steps || []) {
    out.push(step)
    if (step.kind === 'condition') {
      walkSteps(step.then, out)
      walkSteps(step.else, out)
    }
    if (step.kind === 'body') walkSteps(step.body, out)
  }
  return out
}
