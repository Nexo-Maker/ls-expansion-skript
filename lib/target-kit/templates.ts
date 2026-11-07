/**
 * `{param}` templates, the form expansions write their entries' spellings in
 * (`targets: { skript: 'send "{text}" to player' }`). Same rules as the app's: `{name}` and
 * `{a.b}` read params, `{{` and `}}` are literal braces, an unknown name is empty.
 */

import type { Params } from './types'

const TOKEN = /\{\{|\}\}|\{([A-Za-z_][\w.]*)\}/g

function lookup(params: Params, path: string): unknown {
  let value: any = params
  for (const part of path.split('.')) {
    if (value == null) return ''
    value = value[part]
  }
  return value == null ? '' : value
}

/** One template, filled. */
export function fill(template: string, params: Params = {}): string {
  return String(template ?? '').replace(TOKEN, (match, name) => {
    if (match === '{{') return '{'
    if (match === '}}') return '}'
    const value = lookup(params, name)
    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  })
}

/** A template of one line or several (an array, or newlines), as filled lines; empty ones dropped. */
export function fillLines(template: string | string[], params: Params = {}): string[] {
  const lines = Array.isArray(template) ? template : String(template ?? '').split(/\r?\n/)
  return lines.map((l) => fill(l, params)).filter((l) => l !== '')
}

/**
 * The `{name}` placeholders users write in plain text, such as a button's command
 * (`give {player} diamond`), replaced from `values`. Unknown placeholders are left as written.
 */
export function placeholders(text: string, values: Record<string, string>): string {
  return String(text ?? '').replace(/\{([A-Za-z_]\w*)\}/g, (whole, name) => (name in values ? values[name] : whole))
}
