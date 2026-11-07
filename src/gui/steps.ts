/**
 * GUI Logic's steps and checks in Skript. They run inside the GUI's functions (skript-gui), where
 * `{_p}` is the player and `{_inv}` their copy of the GUI. Item slots are found by their Slot ID.
 */

import { spellings, type GuiLayout } from 'target-kit'
import { count, sound } from 'skript-lang'
import { guiNames } from 'skript-gui'
import { PREFIX } from '../config'
import { Unspellable, giveLines, say, vanillaItem, type Ctx } from '../context'
import type { Condition, StepTables } from '../steps'

const P = '{_p}'
const INV = '{_inv}'

/** Lines that give an item slot's contents back to the player (dropped when there is no room). */
export function giveBack(index: number): string[] {
  const slot = `slot ${index} of ${INV}`
  return [
    `if ${slot} is not air:`,
    `    if ${P} has enough space for ${slot}:`,
    `        give ${slot} to ${P}`,
    '    else:',
    `        drop ${slot} at ${P}`,
    `    set ${slot} to air`
  ]
}

/** Opens another GUI of the project, a tick later (an inventory cannot be swapped mid-click). */
export function openGuiLines(ctx: Ctx, guiId: string): string[] {
  const id = String(guiId || '').trim()
  if (!id) throw new Unspellable('no GUI picked')
  if (!ctx.guis.has(id)) throw new Unspellable(`there is no GUI "${id}" in the project`)
  return ['wait 1 tick', `${guiNames({ id, prefix: PREFIX }).open}(${P})`]
}

export function guiStepTables(layout: GuiLayout, catalog: Record<string, any>): StepTables {
  /** The picked item slot's cell; Unspellable when none is picked or it is gone */
  const indexOf = (p: Record<string, any>) => {
    const slot = layout.slotById(String(p.slot || ''))
    if (!slot) throw new Unspellable(p.slot ? `there is no item slot "${p.slot}"` : 'no slot picked')
    return slot.index
  }
  const slotOf = (p: Record<string, any>) => `slot ${indexOf(p)} of ${INV}`

  const actions = spellings<Ctx, string[]>({
    takeFromSlot: (p) => {
      const slot = slotOf(p)
      const amount = count(p.amount, 1)
      return [
        `if item amount of ${slot} is greater than ${amount}:`,
        `    remove ${amount} from item amount of ${slot}`,
        'else:',
        `    set ${slot} to air`
      ]
    },
    returnSlot: (p) => giveBack(indexOf(p)),
    clearSlot: (p) => [`set ${slotOf(p)} to air`],
    setSlot: (p) => [`set ${slotOf(p)} to ${count(p.amount, 1)} of ${vanillaItem(p.item, 'diamond')}`],
    message: (p, ctx) => [`send ${say(ctx, p.text)} to ${P}`],
    giveItem: (p, ctx) => giveLines(ctx, p.item, count(p.amount, 1), P),
    sound: (p) => [`play sound "${sound(p.sound)}" to ${P}`],
    command: (p, ctx) => {
      const command = String(p.command || '').trim().replace(/^\//, '')
      if (!command) throw new Unspellable('no command')
      const literal = say(ctx, command)
      return [p.as === 'player' ? `make ${P} execute command ${literal}` : `execute console command ${literal}`]
    },
    closeGui: () => ['wait 1 tick', `close ${P}'s inventory`],
    openGui: (p, ctx) => openGuiLines(ctx, p.gui),
    wait: (p) => [`wait ${count(p.ticks, 20)} ticks`]
  })

  const conditions = spellings<Ctx, Condition>({
    slotHas: (p) => {
      const slot = slotOf(p)
      const amount = count(p.amount, 1)
      const kind = String(p.item || '').trim() ? `${slot} is ${vanillaItem(p.item)}` : `${slot} is not air`
      return amount > 1 ? [kind, `item amount of ${slot} >= ${amount}`] : kind
    },
    slotEmpty: (p) => `${slotOf(p)} is air`,
    playerHasItem: (p) => `${P} has ${count(p.amount, 1)} of ${vanillaItem(p.item, 'diamond')}`,
    hasPermission: (p) => {
      const permission = String(p.permission || '').trim()
      if (!permission) throw new Unspellable('no permission')
      return `${P} has permission "${permission.replace(/"/g, '""')}"`
    }
  })

  return { actions, conditions, catalog }
}
