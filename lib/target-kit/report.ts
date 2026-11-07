/**
 * Warnings, collected while compiling and returned with the files: the app logs them and the
 * editors' code views show them. A target reports what it cannot spell rather than guessing.
 */

export interface Report {
  /** Adds a warning, prefixed with this report's scope (`GUI shop: ...`). */
  warn(message: string): void
  /** A report whose warnings go to the same list, under another scope. */
  scope(name: string): Report
  /** Every warning so far, each once. */
  readonly warnings: string[]
}

export function createReport(prefix = ''): Report {
  const list: string[] = []
  const make = (scope: string): Report => ({
    warn(message: string) {
      const line = scope ? `${scope}: ${message}` : message
      if (!list.includes(line)) list.push(line)
    },
    scope(name: string) {
      return make(scope ? `${scope} > ${name}` : name)
    },
    get warnings() {
      return [...list]
    }
  })
  return make(prefix)
}
