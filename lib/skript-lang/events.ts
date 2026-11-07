/**
 * Mechanics triggers (the catalog's `category.event` keys) as Skript events.
 *
 *   line      the event line, without the colon
 *   player    the Skript expression for the player the event is about, or null when there is
 *             none (steps that need a player are then reported, not written)
 *   setup     lines the event body starts with: a guard (`event-block is set`), or the player
 *             taken from the event (`set {_p} to victim`)
 *   tokens    token overrides that only hold in this event (`victim` in damage and death events)
 *   cancellable  false where Skript refuses `cancel event` (join, quit, ...)
 *
 * Every line here parses on Skript 2.16 and 2.17 (checked on a server), and so does every token
 * override, in its own event. Triggers missing here have no Skript event (shearing, for one) and
 * are reported by the target.
 */

export interface SkriptEvent {
  line: string
  player: string | null
  setup?: string[]
  tokens?: Record<string, string>
  cancellable?: boolean
}

const VICTIM = {
  'context.entity': 'victim',
  'context.entity.entity_type': 'type of victim',
  'context.entity.name': 'name of victim',
  'context.entity.location': 'location of victim',
  'context.entity.health': 'health of victim'
}

/** Tokens only some events have, named as those events' own expressions */
const PLACED = { 'context.new_material.name': 'type of event-block' }
const BROKEN = { 'context.old_material.name': 'type of event-block' }
const DAMAGE = { ...VICTIM, 'context.damager.is_projectile': 'whether projectile is set' }
const INVENTORY = { 'context.inventory.inventory_type': 'type of event-inventory' }
const EXPLOSION = { 'context.blocks': 'exploded blocks' }
const DEATH = { ...VICTIM, 'context.message': 'death message' }

const player = (line: string, extra: Partial<SkriptEvent> = {}): SkriptEvent => ({ line, player: 'player', ...extra })
const world = (line: string, extra: Partial<SkriptEvent> = {}): SkriptEvent => ({ line, player: null, ...extra })
/** An event about an entity that is a player only sometimes: it runs for players, as `{_p}`. */
const playerAs = (line: string, who: 'victim' | 'attacker', tokens: Record<string, string>): SkriptEvent => ({
  line,
  player: '{_p}',
  setup: [`${who} is a player`, `set {_p} to ${who}`],
  tokens
})

export const EVENTS: Record<string, SkriptEvent> = {
  'player.rightclick': player('on right click', { setup: ['event-block is set'] }),
  'player.leftclick': player('on left click', { setup: ['event-block is set'] }),
  'player.breaks': player('on break', { tokens: BROKEN }),
  'player.places': player('on place', { tokens: PLACED }),
  'player.joins': player('on join', { cancellable: false }),
  'player.quits': player('on quit', { cancellable: false }),
  'player.chat': player('on chat'),
  'player.moves': player('on player move', { tokens: { 'context.origin': 'past event-location', 'context.destination': 'future event-location' } }),
  'player.jumps': player('on jump'),
  'player.sneaks': player('on sneak toggle'),
  'player.sprints': player('on sprint toggle'),
  'player.respawns': player('on respawn', { cancellable: false }),
  'player.dies': playerAs('on death of player', 'victim', DEATH),
  'player.damagesEntity': playerAs('on damage', 'attacker', VICTIM),
  'player.takesdamage': playerAs('on damage of player', 'victim', DAMAGE),
  'player.interactsEntity': player('on right click on entity'),
  'player.dropItem': player('on drop'),
  'player.pickupItem': player('on pick up'),
  'player.consumesItem': player('on consume'),
  'player.changesWorld': player('on world change', { cancellable: false, tokens: { 'context.origin': 'past event-world', 'context.destination': 'event-world' } }),
  'player.levelup': player('on level change', { cancellable: false, tokens: { 'context.level': 'future level' } }),
  'player.fishing': player('on fishing state change', { tokens: { 'context.state': 'event-fishingstate' } }),
  'player.opensInventory': player('on inventory open', { tokens: INVENTORY }),
  'player.closesInventory': player('on inventory close', { cancellable: false, tokens: INVENTORY }),
  'player.swapHand': player('on swap hand items'),
  'player.enchantItem': player('on enchant', { tokens: { 'context.enchantments': 'applied enchantments', 'context.cost': 'enchanting cost' } }),
  'player.sleeps': player('on bed enter'),
  'player.wakes': player('on bed leave'),
  'player.shootsBow': world('on shoot'),
  'player.tamesEntity': player('on tame'),
  'player.clicksInventory': player('on inventory click', { tokens: { ...INVENTORY, 'context.slot': 'index of event-slot', 'context.click': 'click type' } }),
  'player.togglesFlight': player('on flight toggle'),
  'player.craftItem': player('on craft'),
  'player.commandPreprocess': player('on command', { tokens: { 'context.raw_args': 'arguments' } }),
  'entity.dies': world('on death', { tokens: DEATH }),
  'entity.spawns': world('on spawn'),
  'entity.damaged': world('on damage', { tokens: DAMAGE }),
  'entity.target': world('on target'),
  'entity.explodes': world('on explode', { tokens: EXPLOSION }),
  'entity.breeds': world('on breed'),
  'entity.changesBlock': world('on entity change block'),
  'entity.enterPortal': world('on portal enter'),
  'entity.entityPickup': world('on entity pick up'),
  // `on load` is these scripts loading, which every reload does too: that is Script Reload
  'server.start': world('on skript start', { cancellable: false }),
  'server.stop': world('on skript stop', { cancellable: false }),
  'server.reload': world('on load', { cancellable: false }),
  'server.tick': world('every tick', { cancellable: false }),
  'world.load': world('on world load', { cancellable: false }),
  'world.unload': world('on world unload'),
  'world.explosion': world('on explode', { tokens: EXPLOSION }),
  'world.blockBurns': world('on burn'),
  'world.blockGrows': world('on grow'),
  'world.blockFades': world('on fade'),
  'world.blockSpreads': world('on spread'),
  'world.redstone': world('on redstone', { cancellable: false, tokens: { 'context.current': 'redstone power of event-block' } }),
  'world.leavesDecay': world('on leaves decay'),
  'world.lightningStrikes': world('on lightning strike', { tokens: { 'context.location': 'location of event-entity' } })
}
