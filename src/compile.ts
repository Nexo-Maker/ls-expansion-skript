/**
 * The whole project as Skript: a file per mechanic, a file per GUI, and the `/nm` command. Pure:
 * the bundle in, files and warnings out (the app's tests run it on real bundles).
 */

import { createReport, type Bundle, type Catalog, type CompiledFile } from 'target-kit'
import { PATHS } from './config'
import { compileGui } from './gui/compile'
import { compileMechanic } from './mechanics/compile'
import { compileGuiCommand } from './system/command'

export interface CompileResult {
  files: CompiledFile[]
  warnings: string[]
}

export function compileProject(bundle: Bundle, catalog: Catalog): CompileResult {
  const report = createReport()
  const options = {
    catalog,
    contentPlugin: bundle.contentPlugin,
    guis: new Set(bundle.guis.map((g) => g.id)),
    report
  }
  const files: CompiledFile[] = []

  for (const mechanic of bundle.mechanics) {
    const content = compileMechanic(mechanic, options)
    if (content) files.push({ path: PATHS.mechanic(mechanic.id), content })
  }
  for (const gui of bundle.guis) {
    files.push({ path: PATHS.gui(gui.id), content: compileGui(gui, options) })
  }
  // The command every GUI is opened with; an editor's preview shows only the item it is about
  if (!bundle.preview && bundle.guis.length) files.push({ path: PATHS.system, content: compileGuiCommand(bundle) })

  return { files, warnings: report.warnings }
}
