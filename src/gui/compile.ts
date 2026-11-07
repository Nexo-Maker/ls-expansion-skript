/**
 * One GUI from the GUI editor as a Skript file: its layout through target-kit, its Logic through
 * the step tables, the whole through skript-gui.
 *
 *   button click   the button's Logic (When a button is clicked), then its own action from
 *                  Design: run its commands, or open another GUI
 *   item slot      a chest cell; its Logic (When a slot changes) runs a tick after a change
 *   open / close   the GUI's Logic for those moments; close runs before slots are given back
 */

import { buttonAction, guiLayout, guiLogic, placeholders, type Catalog, type Gui, type GuiElement, type Report } from 'target-kit'
import { quote } from 'skript-lang'
import { chestGui, type ChestGuiSpec } from 'skript-gui'
import { BUTTON_ITEM, PREFIX } from '../config'
import { Unspellable, createCtx, type Ctx } from '../context'
import { stepsToSkript } from '../steps'
import { guiStepTables, openGuiLines } from './steps'

/** The item a button shows: the content plugins' invisible item, with the button's name and lore. */
export function buttonItem(element: GuiElement): string {
  const material = String(element.material || BUTTON_ITEM.material).toLowerCase().replace(/^minecraft:/, '').replace(/_/g, ' ')
  const model = Number.isFinite(element.customModelData) ? element.customModelData : BUTTON_ITEM.customModelData
  let item = `${material} with custom model data ${model}`
  if (element.displayName) item += ` named ${quote(element.displayName)}`
  const lore = (element.lore || []).filter((l) => String(l).trim())
  if (lore.length) item += ` with lore ${lore.map((l) => quote(l)).join(' and ')}`
  return item
}

/** A button's own commands, `{player}` and the like filled in, run by the console as Denizen does. */
function commandLines(commands: string[]): string[] {
  return commands.map((command) => {
    const filled = placeholders(command.replace(/"/g, '""').replace(/%/g, '%%'), {
      player: '%{_p}%',
      player_name: '%{_p}%',
      player_uuid: '%uuid of {_p}%',
      slot: '%{_slot}%'
    })
    return `execute console command "${filled}"`
  })
}

export function compileGui(gui: Gui, options: { catalog: Catalog; contentPlugin: string; guis: Set<string>; report: Report }): string {
  const report = options.report.scope(`GUI ${gui.id}`)
  const layout = guiLayout(gui)
  const logic = guiLogic(gui, layout)
  const ctx: Ctx = createCtx({ player: '{_p}', contentPlugin: options.contentPlugin, guis: options.guis, report })
  const tables = guiStepTables(layout, options.catalog.gui.steps)
  const run = (steps: Parameters<typeof stepsToSkript>[0]) => stepsToSkript(steps, ctx, tables)

  for (const trigger of logic.other) {
    const label = options.catalog.gui.triggers?.[trigger.event]?.label || trigger.event
    report.warn(`the Logic trigger "${label}" has no Skript spelling, left out`)
  }
  for (const trigger of logic.dangling) {
    report.warn(`a "${trigger.event}" trigger points at a ${trigger.event === 'buttonClick' ? 'button' : 'slot'} the GUI no longer has, left out`)
  }

  const spec: ChestGuiSpec = {
    id: gui.id,
    prefix: PREFIX,
    titleLiteral: quote(gui.titleGlyph?.text ?? gui.title),
    rows: layout.rows,
    buttons: layout.buttons.map((button) => {
      const onClick = run(logic.buttonClick.get(button.id) || [])
      const action = buttonAction(button.element)
      if (action?.kind === 'commands') onClick.push(...commandLines(action.commands))
      if (action?.kind === 'gui') {
        try {
          onClick.push(...openGuiLines(ctx, action.gui))
        } catch (err) {
          if (!(err instanceof Unspellable)) throw err
          report.warn(`button ${button.id}: ${err.message}`)
          onClick.push(`# Not exported: opening "${action.gui}" (${err.message})`)
        }
      }
      return { id: button.id, cells: button.cells, item: buttonItem(button.element), onClick }
    }),
    slots: layout.slots.map((slot) => ({
      id: slot.slotId,
      index: slot.index,
      returnOnClose: slot.returnOnClose,
      onChange: run(logic.slotChange.get(slot.slotId) || [])
    })),
    onOpen: run(logic.open),
    onClose: run(logic.close)
  }

  const header = [
    `# GUI: ${gui.display || gui.id}`,
    '# Written by Lode Studio (Skript target). Edit the GUI in the app, not here: this file is',
    '# replaced on every export.',
    `# Open it with: ${gui.openCommand || `/nm gui open ${gui.id} {player}`}`,
    ''
  ]
  return header.join('\n') + '\n' + chestGui(spec)
}
