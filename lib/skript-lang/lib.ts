/**
 * skript-lang: writing Skript from code. String literals and variable tokens, item names,
 * durations, identifiers, event lines, and a writer set up for Skript's indentation.
 *
 *   import { skriptWriter, text, tokenResolver, EVENTS, itemName } from 'skript-lang'
 *
 * Every table here was checked against Skript 2.16 on a Paper server.
 */

import { ScriptWriter } from 'script-writer'

export const libId = 'skript-lang'

export { quote, text, tokenResolver, reference, type TextOptions } from './text'
export { TOKENS, NO_SKRIPT } from './tokens'
export { EVENTS, type SkriptEvent } from './events'
export { itemName, entityName, timespan, number, count, ident, sound } from './values'

/**
 * A writer for a Skript file: four-space indentation, `#` comments, and `stop` in a section that
 * would otherwise be empty (Skript refuses empty sections).
 */
export function skriptWriter(): ScriptWriter {
  return new ScriptWriter({ indent: '    ', comment: '#', emptyBlock: 'stop' })
}

/** The header every generated file starts with. */
export function fileHeader(w: ScriptWriter, what: string, by: string) {
  w.comment(`${what}`)
  w.comment(`Written by ${by}. Edit it there, not here: this file is replaced on every export.`)
  w.blank()
}
