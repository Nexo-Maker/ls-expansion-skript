/**
 * target-kit: what every scripting target needs, whatever language it writes. Bundle types,
 * spelling tables with coverage, GUI layout and Logic indexing, `{param}` templates, warnings.
 *
 *   import { spellings, guiLayout, guiLogic, createReport } from 'target-kit'
 *
 * No dependencies, no `sdk` import: usable and testable anywhere.
 */

export const libId = 'target-kit'

export * from './types'
export { createReport, type Report } from './report'
export { fill, fillLines, placeholders } from './templates'
export { spellings, walkSteps, type Spell, type SpellingTable, type SpellResult, type SpellOptions } from './spellings'
export {
  guiLayout,
  guiLogic,
  buttonAction,
  itemRef,
  type GuiLayout,
  type GuiLogicIndex,
  type ButtonLayout,
  type SlotLayout
} from './gui'
