/**
 * The script bundle, as a scripting target receives it (`sdk.scripting.registerTarget`'s
 * `compile`). Kept here rather than imported from `sdk` so the kit has no dependency and can be
 * used, and tested, on its own. The SDK's `ScriptBundle` type is the same shape.
 */

export type Params = Record<string, any>

export type Step =
  | { kind: 'action'; command: string; params: Params; nodeId: string }
  | { kind: 'condition'; command: string; params: Params; nodeId: string; then: Step[]; else: Step[] }
  | { kind: 'body'; command: string; params: Params; nodeId: string; body: Step[] }

export interface Mechanic {
  id: string
  itemId: string
  display: string
  trigger: { category: string; event: string; params: Params; nodeId: string } | null
  steps: Step[]
  warnings: string[]
}

export interface GuiElement {
  type: 'button' | 'slot' | 'text' | 'shape' | 'image' | string
  id?: string
  slot?: number
  width?: number
  height?: number
  slotId?: string
  returnOnClose?: boolean
  displayName?: string
  lore?: string[]
  actionType?: 'command' | 'gui' | string
  command?: string
  targetGui?: string
  material?: string
  customModelData?: number
  [key: string]: any
}

export interface GuiLogicTrigger {
  event: string
  params: Params
  nodeId: string
  steps: Step[]
}

export interface Gui {
  id: string
  itemId: string
  display: string
  title: string
  rows: number
  elements: GuiElement[]
  groups: unknown[]
  openCommand: string
  titleGlyph: { glyph: string; shift: number; text: string }
  backgroundColor?: string
  hideBackground?: boolean
  logic: { graph: unknown; triggers: GuiLogicTrigger[] }
}

export interface Bundle {
  version: number
  projectId: string
  contentPlugin: string
  preview?: boolean
  commands: { gui: { name: string; aliases: string[]; permission: string; usage: string } }
  mechanics: Mechanic[]
  guis: Gui[]
  legacy: unknown[]
}

/** `catalog` as `compile` receives it: every entry, with `targets` spellings on added ones. */
export interface Catalog {
  mechanics: { triggers: Record<string, any>; actions: Record<string, any>; categories?: any; variables?: any; bodyActions?: string[] }
  gui: { triggers: Record<string, any>; steps: Record<string, any>; triggerGroups?: any; stepGroups?: any }
}

export interface CompiledFile {
  path: string
  content: string
}
