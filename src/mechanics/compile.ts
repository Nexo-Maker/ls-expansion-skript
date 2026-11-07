/** One mechanic as a Skript file: its trigger's event, and its program. */

import { fill, type Catalog, type Mechanic, type Report } from 'target-kit'
import { EVENTS, skriptWriter } from 'skript-lang'
import { TARGET_ID } from '../config'
import { createCtx } from '../context'
import { stepsToSkript, type StepTables } from '../steps'
import { ACTIONS } from './actions'
import { BODIES } from './bodies'
import { CONDITIONS } from './conditions'

export function compileMechanic(
  mechanic: Mechanic,
  options: { catalog: Catalog; contentPlugin: string; guis: Set<string>; report: Report }
): string | null {
  const report = options.report.scope(`mechanic ${mechanic.id}`)
  if (!mechanic.trigger) {
    report.warn('it has no trigger, so it is not exported')
    return null
  }

  const key = `${mechanic.trigger.category}.${mechanic.trigger.event}`
  let event = EVENTS[key]
  if (!event) {
    // A trigger an expansion added, spelled for this target: it is a player event
    const added = options.catalog.mechanics.triggers?.[mechanic.trigger.category]?.events?.[mechanic.trigger.event]
    const line = added?.targets?.[TARGET_ID]
    if (!line) {
      report.warn(`the trigger "${added?.label || key}" has no Skript event, so it is not exported`)
      return null
    }
    event = { line: fill(String(line), mechanic.trigger.params || {}).replace(/:$/, ''), player: 'player' }
  }

  const ctx = createCtx(
    { player: event.player, contentPlugin: options.contentPlugin, guis: options.guis, report, cancellable: event.cancellable },
    event.tokens
  )
  const tables: StepTables = { actions: ACTIONS, conditions: CONDITIONS, bodies: BODIES, catalog: options.catalog.mechanics.actions }
  const body = [...(event.setup || []), ...stepsToSkript(mechanic.steps, ctx, tables)]

  const w = skriptWriter()
  w.comment(`Mechanic: ${mechanic.display || mechanic.id}`)
  w.comment('Written by Lode Studio (Skript target). Edit the mechanic in the app, not here: this file')
  w.comment('is replaced on every export.')
  w.blank()
  w.block(`${event.line}:`, (w) => w.lines(body))
  return w.toString()
}
