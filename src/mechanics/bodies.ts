/**
 * Loops and gates: what was wired after the card runs inside them (in Skript, inside the section
 * the card opens). A cooldown has no section: it stops the trigger when it is still running.
 */

import { spellings } from 'target-kit'
import { count, ident, number, timespan } from 'skript-lang'
import { PREFIX } from '../config'
import { playerOf, ref, vanillaItem, type Ctx } from '../context'
import type { Body } from '../steps'

export const BODIES = spellings<Ctx, Body>({
  Repeat: (p) => ({ open: [`loop ${count(p.count, 3)} times:`], nest: true }),
  Foreach: (p, ctx) => ({ open: [`loop ${ref(ctx, p.list, () => 'all players')}:`], nest: true }),
  ForEachBlockInRadius: (p, ctx) => ({
    open: [
      `loop blocks in radius ${number(p.radius, 5)} around ${ref(ctx, p.center, () => `location of ${playerOf(ctx)}`)}:`,
      `    if loop-block is ${vanillaItem(p.blockType)}:`
    ],
    nest: true
  }),
  RandomChance: (p) => ({ open: [`chance of ${number(p.percent, 50)}%:`], nest: true }),
  Cooldown: (p, ctx) => {
    const key = `{${PREFIX}::cooldown::%${ref(ctx, p.target, () => playerOf(ctx))}%::${ident(p.id || 'default')}}`
    return {
      open: [`if difference between ${key} and now is less than ${timespan(p.duration, '10 seconds')}:`, '    stop', `set ${key} to now`],
      nest: false
    }
  }
})
