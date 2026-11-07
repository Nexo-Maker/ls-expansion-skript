/**
 * Programs as Skript lines: one walker for Mechanics and GUI Logic. Each kind of step is spelled
 * by a table (target-kit `spellings`); a step no table or template can spell becomes a comment and
 * a warning, never a guess.
 */

import { hasCode, indentLines } from 'script-writer'
import type { SpellingTable, Step } from 'target-kit'
import { TARGET_ID } from './config'
import { Unspellable, type Ctx } from './context'

/** What a loop or gate opens with; what was wired after it runs inside. */
export interface Body {
  open: string[]
  /** Whether the following steps go inside the last line's section (`loop 3 times:`), one level in from it */
  nest: boolean
}

/** A condition: one line, or several that must all hold (written as an `if all:` section). */
export type Condition = string | string[]

export interface StepTables {
  actions: SpellingTable<Ctx, string[]>
  conditions: SpellingTable<Ctx, Condition>
  bodies?: SpellingTable<Ctx, Body>
  /** The catalog section the steps' commands are keys of, for expansions' entries */
  catalog: Record<string, any>
}

const notExported = (ctx: Ctx, step: Step, reason: string) => {
  ctx.report.warn(`${step.command}: ${reason}`)
  return [`# Not exported: ${step.command} (${reason})`]
}

export function stepsToSkript(steps: Step[], ctx: Ctx, tables: StepTables): string[] {
  const out: string[] = []
  for (const step of steps) {
    try {
      out.push(...stepToSkript(step, ctx, tables))
    } catch (err) {
      if (!(err instanceof Unspellable)) throw err
      out.push(...notExported(ctx, step, err.message))
    }
  }
  return out
}

function stepToSkript(step: Step, ctx: Ctx, tables: StepTables): string[] {
  const entry = tables.catalog?.[step.command]
  const opts = { targetId: TARGET_ID, entry }

  if (step.kind === 'condition') {
    const test = tables.conditions.spell(step, ctx, opts)
    if (!test.ok) return notExported(ctx, step, test.reason)
    // A template's lines, or a table's list: all of them must hold
    const all = Array.isArray(test.value) ? test.value : [test.value]
    const yes = stepsToSkript(step.then, ctx, tables)
    const no = stepsToSkript(step.else, ctx, tables)
    if (!yes.length && !no.length) return []
    const then = indentLines(hasCode(yes) ? yes : [...yes, 'set {_passed} to true'])
    const otherwise = no.length ? ['else:', ...indentLines(hasCode(no) ? no : [...no, 'set {_passed} to false'])] : []
    if (all.length === 1) return [`if ${all[0]}:`, ...then, ...otherwise]
    return ['if all:', ...indentLines(all), 'then:', ...then, ...otherwise]
  }

  if (step.kind === 'body' && tables.bodies?.has(step.command)) {
    const body = tables.bodies.spell(step, ctx, opts)
    const inner = stepsToSkript(step.body, ctx, tables)
    if (!body.ok || body.from !== 'table') return notExported(ctx, step, body.ok ? 'unexpected template' : body.reason)
    if (!body.value.nest) return [...body.value.open, ...inner]
    const last = body.value.open[body.value.open.length - 1]
    const pad = (/^ */.exec(last)?.[0] ?? '') + '    '
    return [...body.value.open, ...indentLines(hasCode(inner) ? inner : [...inner, 'stop'], pad)]
  }

  const action = tables.actions.spell(step, ctx, opts)
  const lines = action.ok ? action.value : notExported(ctx, step, action.reason)
  // A body the tables do not spell: the action, then what follows it
  return step.kind === 'body' ? [...lines, ...stepsToSkript(step.body, ctx, tables)] : lines
}
