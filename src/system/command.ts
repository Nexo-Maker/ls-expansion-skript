/**
 * `/nm gui open <gui> [player]`: the command the GUI editor shows under every GUI. Denizen's
 * nm_system.dsc provides it; this is the same command in Skript, opening each GUI through its
 * skript-gui open function.
 */

import type { Bundle } from 'target-kit'
import { quote, skriptWriter } from 'skript-lang'
import { guiNames } from 'skript-gui'
import { PREFIX } from '../config'

export function compileGuiCommand(bundle: Bundle): string {
  const c = bundle.commands.gui
  const usage = quote(`Usage: ${c.usage}`)
  const w = skriptWriter()
  w.comment('Lode Studio command system (Skript target).')
  w.comment('Replaced on every export.')
  w.blank()
  w.block(`command /${c.name} [<text>] [<text>] [<text>] [<player>]:`, (w) => {
    w.line(`permission: ${c.permission}`)
    if (c.aliases.length) w.line(`aliases: ${c.aliases.map((a) => `/${a}`).join(', ')}`)
    w.line(`usage: ${c.usage}`)
    w.block('trigger:', (w) => {
      w.block('if arg-1 is not "gui":', (w) => w.lines([`send ${usage} to sender`, 'stop']))
      w.block('if arg-2 is not "open":', (w) => w.lines([`send ${usage} to sender`, 'stop']))
      w.line('set {_target} to arg-4 ? player')
      w.block('if {_target} is not set:', (w) =>
        w.lines(['send "Name a player when running this from the console." to sender', 'stop'])
      )
      bundle.guis.forEach((gui, i) => {
        w.block(`${i ? 'else if' : 'if'} arg-3 is ${quote(gui.id)}:`, (w) =>
          w.line(`${guiNames({ id: gui.id, prefix: PREFIX }).open}({_target})`)
        )
      })
      if (bundle.guis.length) {
        w.block('else:', (w) => w.line(`send "GUI '%arg-3%' not found. Available: ${bundle.guis.map((g) => g.id).join(', ')}" to sender`))
      } else {
        w.line('send "This project has no GUIs." to sender')
      }
    })
  })
  return w.toString()
}
