/**
 * A GUI from the bundle, read the way any target needs it: which cell is what, and which Logic
 * runs when. Language-agnostic.
 *
 *   const layout = guiLayout(gui)       cells, buttons (with every cell they cover), item slots
 *   const logic = guiLogic(gui)         steps by moment: open, close, per button, per slot
 */

import type { Gui, GuiElement, GuiLogicTrigger, Step } from './types'

export interface ButtonLayout {
  element: GuiElement
  id: string
  /** Every cell the button covers (it spans `width` x `height` from `slot`), 0-based */
  cells: number[]
}

export interface SlotLayout {
  element: GuiElement
  /** The id GUI Logic refers to it by */
  slotId: string
  /** The cell, 0-based */
  index: number
  /** Whether what is left in it goes back to the player when the GUI closes */
  returnOnClose: boolean
}

export interface GuiLayout {
  rows: number
  size: number
  buttons: ButtonLayout[]
  slots: SlotLayout[]
  /** What occupies each cell: a button, an item slot, or nothing (an empty, inert cell) */
  cells: Array<{ kind: 'button'; button: ButtonLayout } | { kind: 'slot'; slot: SlotLayout } | null>
  slotById(slotId: string): SlotLayout | undefined
  buttonById(id: string): ButtonLayout | undefined
}

export function guiLayout(gui: Gui): GuiLayout {
  const rows = Math.min(6, Math.max(1, Math.round(Number(gui.rows) || 6)))
  const size = rows * 9
  const cells: GuiLayout['cells'] = Array.from({ length: size }, () => null)
  const buttons: ButtonLayout[] = []
  const slots: SlotLayout[] = []

  for (const element of gui.elements || []) {
    if (!Number.isInteger(element.slot)) continue
    const start = element.slot as number
    if (element.type === 'slot') {
      if (start < 0 || start >= size || cells[start]) continue
      const slot: SlotLayout = {
        element,
        slotId: String(element.slotId || `slot_${start}`),
        index: start,
        returnOnClose: element.returnOnClose !== false
      }
      slots.push(slot)
      cells[start] = { kind: 'slot', slot }
    } else if (element.type === 'button') {
      const button: ButtonLayout = { element, id: String(element.id || `button_${start}`), cells: [] }
      for (let dy = 0; dy < (element.height || 1); dy++) {
        for (let dx = 0; dx < (element.width || 1); dx++) {
          const col = (start % 9) + dx
          const row = Math.floor(start / 9) + dy
          const cell = row * 9 + col
          if (col < 9 && row < rows && !cells[cell]) {
            button.cells.push(cell)
            cells[cell] = { kind: 'button', button }
          }
        }
      }
      if (button.cells.length) buttons.push(button)
    }
  }

  return {
    rows,
    size,
    buttons,
    slots,
    cells,
    slotById: (slotId) => slots.find((s) => s.slotId === slotId),
    buttonById: (id) => buttons.find((b) => b.id === id)
  }
}

export interface GuiLogicIndex {
  /** When the GUI opens */
  open: Step[]
  /** When it closes, before item slots are given back */
  close: Step[]
  /** When a button is clicked, by button id */
  buttonClick: Map<string, Step[]>
  /** After an item slot's contents change, by slotId */
  slotChange: Map<string, Step[]>
  /** Triggers of other kinds (an expansion's), for the target to spell or report */
  other: GuiLogicTrigger[]
  /** Triggers that point at a button or slot the GUI does not have */
  dangling: GuiLogicTrigger[]
}

/** The GUI's Logic grouped by when it runs. Several triggers on the same moment run top to bottom. */
export function guiLogic(gui: Gui, layout: GuiLayout = guiLayout(gui)): GuiLogicIndex {
  const index: GuiLogicIndex = { open: [], close: [], buttonClick: new Map(), slotChange: new Map(), other: [], dangling: [] }
  const add = (map: Map<string, Step[]>, key: string, steps: Step[]) => map.set(key, [...(map.get(key) || []), ...steps])

  for (const trigger of gui.logic?.triggers || []) {
    switch (trigger.event) {
      case 'open':
        index.open.push(...trigger.steps)
        break
      case 'close':
        index.close.push(...trigger.steps)
        break
      case 'buttonClick':
        if (layout.buttonById(String(trigger.params.button || ''))) add(index.buttonClick, String(trigger.params.button), trigger.steps)
        else index.dangling.push(trigger)
        break
      case 'slotChange':
        if (layout.slotById(String(trigger.params.slot || ''))) add(index.slotChange, String(trigger.params.slot), trigger.steps)
        else index.dangling.push(trigger)
        break
      default:
        index.other.push(trigger)
    }
  }
  return index
}

/**
 * A button's own click action, as the GUI editor's Design view sets it: run commands, or open
 * another GUI. Commands are one per line, without the slash.
 */
export function buttonAction(element: GuiElement): { kind: 'commands'; commands: string[] } | { kind: 'gui'; gui: string } | null {
  if (element.actionType === 'gui') return element.targetGui ? { kind: 'gui', gui: String(element.targetGui).trim() } : null
  const commands = String(element.command || '')
    .split('\n')
    .map((c) => c.trim().replace(/^\//, ''))
    .filter(Boolean)
  return commands.length ? { kind: 'commands', commands } : null
}

/**
 * An item or block id as the user picked it: `{ custom: true, id: 'ruby' }` for a content
 * plugin's item (`nexo:ruby`, `ia:ruby`, `custom:ruby`, or another namespace), `{ custom: false,
 * id: 'diamond_sword' }` for a vanilla one (`minecraft:diamond_sword`, `DIAMOND_SWORD`).
 */
export function itemRef(value: unknown, fallback = 'stone'): { custom: boolean; id: string } {
  const raw = String(value ?? '').trim() || fallback
  const vanilla = raw.startsWith('minecraft:') || raw === raw.toUpperCase() || !raw.includes(':')
  if (!vanilla || /^(nexo|custom|ia):/.test(raw)) return { custom: true, id: raw.replace(/^(nexo|custom|ia):/, '') }
  return { custom: false, id: raw.replace(/^minecraft:/, '').toLowerCase() }
}
