/**
 * A chest GUI, described for skript-gui. Plain data plus the Skript lines each moment runs; it
 * knows nothing about Lode Studio's bundle, so any expansion that writes Skript can use it.
 *
 * Lines run inside generated functions, where these are set:
 *
 *   {_p}      the player
 *   {_inv}    the GUI's inventory (this player's copy)
 *   {_slot}   in a button's lines: the cell that was clicked (0-based)
 */

export interface ChestGuiButton {
  /** Unique within the GUI; part of a function name */
  id: string
  /** Cells it covers, 0-based */
  cells: number[]
  /** The Skript item it shows, e.g. `paper with custom model data 777 named "Buy"` */
  item: string
  /** What a click runs (empty: the click does nothing) */
  onClick: string[]
}

export interface ChestGuiSlot {
  /** Unique within the GUI; part of a function name */
  id: string
  /** The cell, 0-based */
  index: number
  /** Give its items back when the GUI closes (otherwise they are destroyed with the GUI) */
  returnOnClose: boolean
  /** What runs a tick after its contents change (empty: nothing) */
  onChange: string[]
}

export interface ChestGuiSpec {
  /** Unique among the GUIs on the server; part of every name generated for it */
  id: string
  /** The title as written into a Skript string, i.e. already through `quote`/`text` */
  titleLiteral: string
  rows: number
  buttons: ChestGuiButton[]
  slots: ChestGuiSlot[]
  /** Runs after the GUI opens */
  onOpen: string[]
  /** Runs when it closes, before item slots are given back */
  onClose: string[]
  /**
   * Prefix of every function name and of the metadata tag that marks which GUI a player has open.
   * Default `gui`. Use your own, so two expansions' GUIs never collide.
   */
  prefix?: string
}
