/**
 * The variable tokens the editors write into values (the Mechanics editor's variables, `<tag>`
 * form) and the Skript expression each stands for. `{p}` is the player in the context (`player` in
 * an event, `{_p}` in a function). Tokens missing here have no Skript equivalent we vouch for and
 * are reported (`NO_SKRIPT` says why, for the ones the app offers). Every expression here parses
 * on Skript 2.16 and 2.17. Tokens that only mean something in one event (`context.format` in chat)
 * are that event's own, in ./events.ts, so Skript never sees them where it would refuse them.
 */
export const TOKENS: Record<string, string> = {
  // Player
  player: '{p}',
  'player.name': '{p}',
  'player.uuid': 'uuid of {p}',
  'player.location': 'location of {p}',
  'player.world.name': 'name of world of {p}',
  'player.health': 'health of {p}',
  'player.health.max': 'max health of {p}',
  'player.food_level': 'food level of {p}',
  'player.xp_level': 'level of {p}',
  'player.xp': 'total experience of {p}',
  'player.gamemode': 'gamemode of {p}',
  'player.ip': 'ip of {p}',
  'player.ping': 'ping of {p}',
  'player.is_flying': 'whether {p} is flying',
  'player.is_sneaking': 'whether {p} is sneaking',
  'player.is_sprinting': 'whether {p} is sprinting',
  'player.is_on_ground': 'whether {p} is on ground',
  'player.is_op': 'whether {p} is op',
  'player.location.yaw': 'yaw of {p}',
  'player.location.pitch': 'pitch of {p}',
  'player.location.x': 'x-coordinate of {p}',
  'player.location.y': 'y-coordinate of {p}',
  'player.location.z': 'z-coordinate of {p}',
  'player.location.above': 'location of block above {p}',
  'player.location.below': 'location of block below {p}',
  'player.location.block.material.name': 'type of block at {p}',
  'player.location.below.block.material.name': 'type of block below {p}',
  'player.location.biome.name': 'biome at {p}',
  'player.location.light': 'light level at {p}',
  'player.location.forward[1]': 'location 1 meters in front of {p}',
  'player.location.forward[3]': 'location 3 meters in front of {p}',
  'player.location.forward[5]': 'location 5 meters in front of {p}',
  'player.eye_location': 'head location of {p}',
  'player.bed_spawn': 'bed location of {p}',
  'player.world.spawn_location': 'spawn of world of {p}',
  'player.cursor_on': 'location of target block of {p}',
  'player.cursor_on.above': 'location of block above target block of {p}',
  'player.cursor_on.x': 'x-coordinate of target block of {p}',
  'player.cursor_on.y': 'y-coordinate of target block of {p}',
  'player.cursor_on.z': 'z-coordinate of target block of {p}',
  'player.item_in_hand': 'tool of {p}',
  'player.item_in_hand.material.name': 'type of tool of {p}',
  'player.item_in_hand.display': 'name of tool of {p}',
  'player.item_in_hand.quantity': 'item amount of tool of {p}',
  'player.item_in_hand.full': 'tool of {p}',
  // Damage taken, as Denizen's durability counts it (Skript's `durability` is what is left)
  'player.item_in_hand.durability': 'damage of tool of {p}',
  'player.item_in_hand.max_durability': 'max durability of tool of {p}',
  'player.item_in_hand.enchantment_map': 'enchantments of tool of {p}',
  'player.item_in_hand.lore': 'lore of tool of {p}',
  'player.inventory.size': 'amount of slots of inventory of {p}',
  'player.item_in_offhand': 'offhand tool of {p}',
  'player.item_in_offhand.material.name': 'type of offhand tool of {p}',
  'player.equipment_map.get[helmet]': 'helmet of {p}',
  'player.equipment_map.get[chestplate]': 'chestplate of {p}',
  'player.equipment_map.get[leggings]': 'leggings of {p}',
  'player.equipment_map.get[boots]': 'boots of {p}',

  // The event (only meaningful in events that have them)
  'context.location': 'location of event-block',
  'context.location.above': 'location of block above event-block',
  'context.material.name': 'type of event-block',
  'context.entity': 'event-entity',
  'context.entity.entity_type': 'type of event-entity',
  'context.entity.name': 'name of event-entity',
  'context.entity.location': 'location of event-entity',
  'context.entity.health': 'health of event-entity',
  'context.damage': 'damage',
  'context.cause': 'damage cause',
  'context.damager': 'attacker',
  'context.item': 'event-item',
  'context.item.material.name': 'type of event-item',
  'context.item.display': 'name of event-item',
  'context.item.full': 'event-item',
  'context.message': 'message',
  'context.command': 'command',

  // Server and utilities
  'server.online_players': 'all players',
  'server.online_players.size': 'number of all players',
  'server.max_players': 'max players count',
  'server.version': 'minecraft version',
  'server.motd': 'motd',
  'server.recent_tps.first': 'tps from the last minute',
  'util.time_now': 'now',
  'util.random.int[1].to[100]': 'random integer between 1 and 100',
  'util.random.int[1].to[10]': 'random integer between 1 and 10',
  'util.random_uuid': 'random uuid',
  'util.random_boolean': 'random element out of true and false',
  'util.pi': 'pi',
  n: 'nl',
  // Nothing: text() drops it from a string, and writes `""` for it alone
  empty: '""'
}

/**
 * Tokens the app offers that have no Skript expression, and why. They are left in the text as
 * written, and reported. Each was tried on a server, not assumed.
 */
export const NO_SKRIPT: Record<string, string> = {
  'player.inventory.empty_slots': 'Skript has no count of empty slots',
  'context.strength': "an explosion's strength is only readable in the explosion prime event",
  'context.experience': 'the level change event has levels, not experience',
  'context.format': 'Skript can set the chat format but not read it',
  'server.current_tick': 'Skript has no server tick counter'
}
