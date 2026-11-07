/**
 * The Mechanics editor's actions in Skript. Params are the catalog's (see the SDK guide's
 * vocabulary table). A spelling that cannot write its step throws Unspellable.
 *
 * Skript counts health in hearts (2 points each) and food in drumsticks; the editor's numbers are
 * points, as Denizen's are, so they are halved.
 */

import { spellings } from 'target-kit'
import { count, entityName, ident, number, sound, timespan } from 'skript-lang'
import { guiNames } from 'skript-gui'
import { PREFIX } from '../config'
import { Unspellable, giveLines, playerOf, ref, say, vanillaItem, type Ctx } from '../context'

const half = (value: unknown, fallback: number) => number(value, fallback) / 2
const at = (ctx: Ctx, value: unknown) => ref(ctx, value, () => `location of ${playerOf(ctx)}`)
const who = (ctx: Ctx, value: unknown) => ref(ctx, value, () => playerOf(ctx))
const world = (value: unknown) => (String(value || '').trim() ? `world "${String(value).trim().replace(/"/g, '')}"` : null)
const unsupported = (why: string) => () => {
  throw new Unspellable(why)
}

export const ACTIONS = spellings<Ctx, string[]>({
  // ---- Feedback
  Narrate: (p, ctx) => [`send ${say(ctx, p.message)} to ${playerOf(ctx)}`],
  PlaySound: (p, ctx) => [`play sound "${sound(p.sound, 'BLOCK_NOTE_BLOCK_PLING')}" with pitch ${number(p.pitch, 1)} at ${at(ctx, p.location)}`],
  SendTitle: (p, ctx) => [`send title ${say(ctx, p.title)} with subtitle ${say(ctx, p.subtitle)} to ${who(ctx, p.player)}`],
  SendActionBar: (p, ctx) => [`send action bar ${say(ctx, p.message)} to ${who(ctx, p.player)}`],
  Toast: unsupported('Skript has no toast notification'),
  Announce: (p, ctx) => [`broadcast ${say(ctx, p.message)}`],
  Sidebar: unsupported('a scoreboard sidebar needs a Skript addon (SkBee)'),
  Log: (p, ctx) => [`send ${say(ctx, p.message)} to console`],

  // ---- Flow
  Run: (p) => {
    const args = String(p.definitions || '').trim()
    return [`${ident(p.task || 'my_function')}(${args ? args.split('|').map((a) => `"${a.replace(/"/g, '""')}"`).join(', ') : ''})`]
  },
  Wait: (p) => [`wait ${timespan(p.duration)}`],
  Stop: () => ['stop'],
  CancelEvent: (_p, ctx) => {
    if (ctx.cancellable === false) throw new Unspellable('this trigger cannot be cancelled')
    return ['cancel event']
  },

  // ---- Data
  Flag: (p, ctx) => [`set {${PREFIX}::flags::%${who(ctx, p.target)}%::${ident(p.flag || 'flag')}} to ${say(ctx, p.value ?? 'true')}`],
  Define: (p, ctx) => [`set {_${ident(p.variable || 'var')}} to ${say(ctx, p.value ?? '')}`],
  Adjust: unsupported('Denizen mechanisms have no general Skript equivalent'),

  // ---- Entities
  Spawn: (p, ctx) => [`spawn ${entityName(p.entity || 'zombie')} at location of ${playerOf(ctx)}`],
  Heal: (p, ctx) => [`heal ${who(ctx, p.target)} by ${half(p.amount, 4)}`],
  Hurt: (p, ctx) => [`damage ${who(ctx, p.target)} by ${half(p.amount, 4)}`],
  Kill: (p, ctx) => [`kill ${who(ctx, p.target)}`],
  Equip: (p, ctx) => [`equip ${who(ctx, p.target)} with ${vanillaItem(p.item, 'diamond_sword')}`],
  PotionEffect: (p, ctx) => [
    `apply ${entityName(p.effect || 'speed')} ${count(p.amplifier, 0, 0) + 1} to ${who(ctx, p.target)} for ${timespan(p.duration, '30 seconds')}`
  ],
  RemoveEffect: (p, ctx) => [`remove ${entityName(p.effect || 'speed')} from ${who(ctx, p.target)}`],
  Burn: (p, ctx) => [`ignite ${who(ctx, p.target)} for ${timespan(p.duration, '5 seconds')}`],
  Feed: (p, ctx) => [`set food level of ${who(ctx, p.player)} to ${half(p.amount, 20)}`],
  Push: (p, ctx) => [`set velocity of ${who(ctx, p.target)} to vector(${number(p.x, 0)}, ${number(p.y, 1)}, ${number(p.z, 0)})`],
  RemoveEntity: (p, ctx) => [`delete ${ref(ctx, p.target, () => 'event-entity')}`],
  Mount: (p, ctx) => [`make ${who(ctx, p.rider)} ride ${ref(ctx, p.vehicle, () => 'event-entity')}`],

  // ---- World
  Teleport: (p, ctx) => [`teleport ${who(ctx, p.target)} to ${at(ctx, p.location)}`],
  GiveItem: (p, ctx) => giveLines(ctx, p.item, count(p.amount, 1), who(ctx, p.player)),
  TakeItem: (p, ctx) => [`remove ${count(p.amount, 1)} of ${vanillaItem(p.item)} from ${who(ctx, p.player)}'s inventory`],
  SetHealth: (p, ctx) => [`set health of ${who(ctx, p.target)} to ${half(p.health, 20)}`],
  OpenGUI: (p, ctx) => {
    const id = String(p.gui || '').trim()
    if (!id) throw new Unspellable('no GUI picked')
    if (!ctx.guis.has(id)) throw new Unspellable(`there is no GUI "${id}" in the project`)
    return [`${guiNames({ id, prefix: PREFIX }).open}(${who(ctx, p.player)})`]
  },
  Explode: (p, ctx) => {
    if (p.fire === true || p.fire === 'true') ctx.report.warn('Explode: Skript has no fiery explosion, the fire is left out')
    const safe = p.breakBlocks === false || p.breakBlocks === 'false'
    return [`create ${safe ? 'a safe explosion' : 'an explosion'} of force ${number(p.power, 3)} at ${at(ctx, p.location)}`]
  },
  ModifyBlock: (p, ctx) => [`set block at ${ref(ctx, p.location, () => `location of block below ${playerOf(ctx)}`)} to ${vanillaItem(p.material)}`],
  ReplaceBlocks: (p, ctx) => {
    const percent = number(p.percent, 100)
    const set = `set loop-block to ${vanillaItem(p.toBlock, 'diamond_block')}`
    return [
      `loop blocks in radius ${number(p.radius, 5)} around ${at(ctx, p.center)}:`,
      `    if loop-block is ${vanillaItem(p.fromBlock)}:`,
      ...(percent < 100 ? [`        chance of ${percent}%:`, `            ${set}`] : [`        ${set}`])
    ]
  },
  Particle: (p, ctx) => [`draw ${count(p.quantity, 10)} ${entityName(p.effect || 'flame')} particles at ${at(ctx, p.location)}`],
  Weather: (p) => {
    const type = String(p.type || 'sunny').toLowerCase()
    const weather = type === 'storm' || type === 'thunder' ? 'thunder' : type === 'rain' || type === 'rainy' ? 'rain' : 'clear'
    const w = world(p.world)
    return [`set weather${w ? ` in ${w}` : ''} to ${weather}`]
  },
  SetTime: (p) => {
    const named: Record<string, number> = { day: 1000, noon: 6000, sunset: 12000, night: 13000, midnight: 18000 }
    const raw = String(p.time ?? '1000').trim().toLowerCase()
    const ticks = named[raw] ?? Math.round(number(raw.replace(/t$/, ''), 1000))
    const w = world(p.world)
    return [`set time${w ? ` in ${w}` : ''} to ${Math.floor(((ticks + 6000) % 24000) / 1000)}:${String(Math.floor((((ticks + 6000) % 1000) * 60) / 1000)).padStart(2, '0')}`]
  },
  Lightning: (p, ctx) => [`strike lightning${p.damage === false || p.damage === 'false' ? ' effect' : ''} at ${at(ctx, p.location)}`],
  DropItem: (p, ctx) => [`drop ${count(p.quantity, 1)} of ${vanillaItem(p.item, 'diamond')} at ${at(ctx, p.location)}`],
  Firework: (p, ctx) => [`launch ball firework colored ${String(p.color || 'red').toLowerCase()} at ${at(ctx, p.location)} timed ${count(p.power, 1)}`],
  // Skript 2.16 cannot resize a world border; the vanilla command can (the server's main world)
  WorldBorder: (p, ctx) => {
    const center = ref(ctx, p.center, () => `location of ${playerOf(ctx)}`)
    return [
      `execute console command "worldborder center %x-coordinate of ${center}% %z-coordinate of ${center}%"`,
      `execute console command "worldborder set ${count(p.size, 1000)}"`
    ]
  },

  // ---- Player
  Experience: (p, ctx) =>
    /level/i.test(String(p.type)) ? [`add ${count(p.amount, 10)} to level of ${who(ctx, p.player)}`] : [`give ${count(p.amount, 10)} xp to ${who(ctx, p.player)}`],
  Kick: (p, ctx) => [`kick ${who(ctx, p.player)} due to ${say(ctx, p.reason || 'You have been kicked')}`],
  ClearInventory: (p, ctx) => [`clear ${who(ctx, p.player)}'s inventory`],
  SetGameMode: (p, ctx) => [`set gamemode of ${who(ctx, p.player)} to ${String(p.mode || 'survival').toLowerCase()}`],
  SetFly: (p, ctx) => [`set flight mode of ${who(ctx, p.player)} to ${p.enabled === false || p.enabled === 'false' ? 'false' : 'true'}`],
  Oxygen: (p, ctx) => [`set remaining air of ${who(ctx, p.player)} to ${timespan(p.amount ?? '300t', '15 seconds')}`],
  Compass: (p, ctx) => [`set compass target of ${who(ctx, p.player)} to ${at(ctx, p.location)}`],

  // ---- Server
  RunCommand: (p, ctx) => {
    const literal = say(ctx, String(p.command || '').replace(/^\//, ''))
    return p.asPlayer === true || p.asPlayer === 'true' ? [`make ${playerOf(ctx)} execute command ${literal}`] : [`execute console command ${literal}`]
  },
  Scheme: unsupported('schematics need a Skript addon (skript-worldedit)')
})
