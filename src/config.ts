/** What this target is called and where it writes. */

export const TARGET_ID = 'skript'

/** Prefix of every generated function, variable and metadata tag, so nothing collides with users' own scripts. */
export const PREFIX = 'lode'

/** Where the files go, under plugins/Skript/. Skript loads sub-folders of scripts/. */
export const PATHS = {
  mechanic: (id: string) => `scripts/lode/mechanics/${id}.sk`,
  gui: (id: string) => `scripts/lode/guis/${id}.sk`,
  system: 'scripts/lode/system.sk'
}

/** The Skript the test server gets. Generated scripts are checked against this version. */
export const SKRIPT_VERSION = '2.16.2'
export const SKRIPT_URL = `https://github.com/SkriptLang/Skript/releases/download/${SKRIPT_VERSION}/Skript-${SKRIPT_VERSION}.jar`

/** The items GUI buttons show: the content plugins' invisible item (see the GUI editor's glyph). */
export const BUTTON_ITEM = { material: 'paper', customModelData: 777 }
