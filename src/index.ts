import sdk from 'sdk'
import { compileProject } from './compile'
import { SKRIPT_URL, TARGET_ID } from './config'

/**
 * Skript as a scripting target. Once this expansion is loaded, Settings > Exporters > Scripting
 * lists Skript; a project that picks it exports, syncs and previews its Mechanics and GUIs as
 * Skript scripts, and its test server gets Skript installed and reloaded.
 *
 * The work is in the libraries: target-kit (reading the bundle), skript-lang (writing Skript),
 * skript-gui (chest GUIs) and script-writer. This file only wires them to the app.
 */
sdk.scripting.registerTarget({
  id: TARGET_ID,
  name: 'Skript',
  folder: 'Skript',
  description: 'Mechanics and GUIs as Skript scripts',
  language: 'plaintext',
  reloadCommands: ['sk reload all'],
  serverPlugin: { name: 'Skript', jarPrefix: 'skript', url: SKRIPT_URL },
  compile: (bundle, { catalog }) => compileProject(bundle as any, catalog as any)
})
