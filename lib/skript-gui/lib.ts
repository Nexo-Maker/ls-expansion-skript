/**
 * skript-gui: chest GUIs in Skript, with item slots that behave like a chest.
 *
 *   import { chestGui, guiNames } from 'skript-gui'
 *   const source = chestGui(spec)          a complete .sk file for one GUI
 *   guiNames(spec).open                    the function that opens it: `gui_shop_open(player)`
 *
 * What the generated script does:
 *
 *   - Each open builds a fresh copy of the GUI for that player, so players never share items.
 *   - Buttons are fixed: clicks on them are cancelled and run the button's lines.
 *   - Item slots work like a chest: place, take, swap, split, number keys. A tick after a change,
 *     the slot's lines run. Shift-clicking an item in the player's own inventory moves it into the
 *     first empty item slot (or nowhere).
 *   - Every other cell is fixed. Double-click collecting is cancelled while the GUI is open (it
 *     could pull button items out). Drags are allowed only over item slots and the player's own
 *     inventory.
 *   - On close, the close lines run, then what is left in item slots goes back to the player
 *     (dropped at their feet when their inventory is full), unless the slot says otherwise.
 *
 * Which GUI a player has open is a metadata tag (`<prefix>_gui`), so several GUIs, from several
 * scripts, coexist. Checked on Skript 2.16 / Paper.
 */

import { ScriptWriter, hasCode } from 'script-writer'
import { ident, quote } from 'skript-lang'
import type { ChestGuiSpec } from './spec'

export const libId = 'skript-gui'

export type { ChestGuiSpec, ChestGuiButton, ChestGuiSlot } from './spec'

/** The names generated for a GUI, for calling into it from other scripts. */
export function guiNames(spec: Pick<ChestGuiSpec, 'id' | 'prefix'>) {
  const prefix = ident(spec.prefix || 'gui')
  const base = `${prefix}_${ident(spec.id)}`
  return {
    /** `function <base>_open(p: player)`: opens the GUI for a player */
    open: `${base}_open`,
    onOpen: `${base}_on_open`,
    onClose: `${base}_on_close`,
    button: (id: string) => `${base}_button_${ident(id)}`,
    slot: (id: string) => `${base}_slot_${ident(id)}`,
    /** The metadata tag on a player holding the id of the GUI they have open */
    tag: `${prefix}_gui`
  }
}

/** The Skript that opens a GUI for `player` (an expression), from anywhere. */
export function openGui(spec: Pick<ChestGuiSpec, 'id' | 'prefix'>, player = 'player'): string {
  return `${guiNames(spec).open}(${player})`
}

const writer = () => new ScriptWriter({ indent: '    ', comment: '#', emptyBlock: 'stop' })

/** A complete .sk file for one GUI. */
export function chestGui(spec: ChestGuiSpec): string {
  const n = guiNames(spec)
  const rows = Math.min(6, Math.max(1, Math.round(spec.rows || 6)))
  const size = rows * 9
  const isGui = `metadata tag ${quote(n.tag)} of player is ${quote(spec.id)}`
  const slots = spec.slots.filter((s) => s.index >= 0 && s.index < size)
  const slotList = slots.map((s) => s.index).join(' or ')
  const w = writer()
  /** Whether a moment's lines do anything (they may be only comments for steps not exported) */
  const runs = (lines: string[]) => hasCode(lines)

  // ---- opening ----------------------------------------------------------------------------
  w.block(`function ${n.open}(p: player):`, (w) => {
    w.line(`set {_inv} to chest inventory with ${rows} rows named ${spec.titleLiteral}`)
    for (const button of spec.buttons) {
      for (const cell of button.cells) if (cell >= 0 && cell < size) w.line(`set slot ${cell} of {_inv} to ${button.item}`)
    }
    // The tag goes on after `open`: opening closes the GUI the player had, whose close handler
    // clears the tag
    w.line('open {_inv} to {_p}')
    w.line(`set metadata tag ${quote(n.tag)} of {_p} to ${quote(spec.id)}`)
    if (runs(spec.onOpen)) w.line(`${n.onOpen}({_p}, {_inv})`)
  })
  w.blank()

  // A moment whose lines are only comments (steps the target could not write) still gets its
  // function, so the comments are in the file, but nothing calls it
  const fn = (name: string, params: string, lines: string[]) => {
    if (!lines.length) return
    w.block(`function ${name}(${params}):`, (w) => w.lines(lines))
    w.blank()
  }
  fn(n.onOpen, 'p: player, inv: inventory', spec.onOpen)
  fn(n.onClose, 'p: player, inv: inventory', spec.onClose)
  for (const button of spec.buttons) fn(n.button(button.id), 'p: player, inv: inventory, slot: number', button.onClick)
  for (const slot of slots) fn(n.slot(slot.id), 'p: player, inv: inventory', slot.onChange)

  const slotChanged = (w: ScriptWriter, slot: (typeof slots)[number]) => {
    if (runs(slot.onChange)) w.line(`${n.slot(slot.id)}(player, {_inv})`)
  }

  // ---- clicks -----------------------------------------------------------------------------
  w.block('on inventory click:', (w) => {
    w.line(isGui)
    w.line("set {_inv} to player's top inventory")
    w.comment('A click outside the window (dropping the cursor) is left alone')
    w.line('clicked inventory is set')
    w.comment('Collecting to the cursor could pull button items out of the GUI')
    w.block('if click type is double click:', (w) => w.lines(['cancel event', 'stop']))

    w.block("if clicked inventory is player's inventory:", (w) => {
      w.comment("The player's own inventory works as usual. A shift-click would move the item")
      w.comment('into the GUI: it goes to the first empty item slot instead, or nowhere.')
      w.block('if click type is left mouse button with shift or right mouse button with shift:', (w) => {
        w.line('cancel event')
        if (slots.length) {
          w.block('if event-slot is not air:', (w) => {
            slots.forEach((slot, i) => {
              w.block(`${i ? 'else if' : 'if'} slot ${slot.index} of {_inv} is air:`, (w) => {
                w.line(`set slot ${slot.index} of {_inv} to event-slot`)
                w.line('set event-slot to air')
                if (runs(slot.onChange)) {
                  w.line('wait 1 tick')
                  slotChanged(w, slot)
                }
              })
            })
          })
        }
      })
      w.line('stop')
    })

    if (slots.length) {
      w.comment('Item slots work like a chest')
      for (const slot of slots) {
        w.block(`if index of event-slot is ${slot.index}:`, (w) => {
          if (runs(slot.onChange)) {
            w.line('wait 1 tick')
            slotChanged(w, slot)
          }
          w.line('stop')
        })
      }
    }

    w.comment('Everything else in the GUI is fixed')
    w.line('cancel event')
    for (const button of spec.buttons) {
      if (!runs(button.onClick) || !button.cells.length) continue
      w.block(`if index of event-slot is ${button.cells.join(' or ')}:`, (w) => {
        w.line(`${n.button(button.id)}(player, {_inv}, index of event-slot)`)
      })
    }
  })
  w.blank()

  // ---- drags ------------------------------------------------------------------------------
  w.block('on inventory drag:', (w) => {
    w.line(isGui)
    w.line("set {_inv} to player's top inventory")
    w.comment(slots.length ? 'A drag may cover item slots and the player\'s own inventory, nothing else' : 'Nothing in this GUI takes items')
    w.block('loop event-slots:', (w) => {
      w.block(`if raw index of loop-value is less than ${size}:`, (w) => {
        if (slots.length) {
          w.block(`if index of loop-value is not ${slotList}:`, (w) => w.lines(['cancel event', 'stop']))
        } else {
          w.lines(['cancel event', 'stop'])
        }
      })
    })
    const watched = slots.filter((s) => runs(s.onChange))
    if (watched.length) {
      w.line('wait 1 tick')
      w.block('loop event-slots:', (w) => {
        for (const slot of watched) {
          w.block(`if raw index of loop-value is ${slot.index}:`, (w) => slotChanged(w, slot))
        }
      })
    }
  })
  w.blank()

  // ---- closing ----------------------------------------------------------------------------
  w.block('on inventory close:', (w) => {
    w.line(isGui)
    w.line('set {_inv} to event-inventory')
    w.line(`delete metadata tag ${quote(n.tag)} of player`)
    if (runs(spec.onClose)) w.line(`${n.onClose}(player, {_inv})`)
    const returned = slots.filter((s) => s.returnOnClose)
    if (returned.length) {
      w.comment('Each open is a fresh copy: give back what was left in the item slots')
      for (const slot of returned) {
        w.block(`if slot ${slot.index} of {_inv} is not air:`, (w) => {
          w.block(`if player has enough space for slot ${slot.index} of {_inv}:`, (w) =>
            w.line(`give slot ${slot.index} of {_inv} to player`)
          )
          w.block('else:', (w) => w.line(`drop slot ${slot.index} of {_inv} at player`))
          w.line(`set slot ${slot.index} of {_inv} to air`)
        })
      }
    }
  })

  return w.toString()
}

export default { chestGui, guiNames, openGui }
