/**
 * script-writer: builds indentation-based script files (Skript, Denizen, YAML, Python-like
 * languages) as text, without counting spaces by hand.
 *
 *   const w = new ScriptWriter({ indent: '    ', emptyBlock: 'stop' })
 *   w.comment('Generated')
 *   w.block('on join:', (w) => {
 *     w.line('send "Hi" to player')
 *     w.block('if player is sneaking:', (w) => w.line('send "Psst" to player'))
 *   })
 *   w.toString()
 *
 * No dependencies; usable from any expansion or library.
 */

export const libId = 'script-writer'

export interface WriterOptions {
  /** One level of indentation. Default four spaces. */
  indent?: string
  /** The comment prefix. Default `#`. */
  comment?: string
  /** What a block with nothing in it gets, since most languages refuse an empty block. */
  emptyBlock?: string
}

export class ScriptWriter {
  private readonly out: string[] = []
  private depth = 0
  readonly unit: string
  readonly commentPrefix: string
  readonly emptyBlock: string

  constructor(options: WriterOptions = {}) {
    this.unit = options.indent ?? '    '
    this.commentPrefix = options.comment ?? '#'
    this.emptyBlock = options.emptyBlock ?? ''
  }

  private get pad() {
    return this.unit.repeat(this.depth)
  }

  /** One line (or several, split on newlines) at the current indentation. */
  line(text: string): this {
    for (const l of String(text).split('\n')) this.out.push(l ? this.pad + l : '')
    return this
  }

  /** Several lines at the current indentation. */
  lines(texts: Iterable<string>): this {
    for (const t of texts) this.line(t)
    return this
  }

  /** A blank line, never two in a row. */
  blank(): this {
    if (this.out.length && this.out[this.out.length - 1] !== '') this.out.push('')
    return this
  }

  /** A comment, one prefixed line per line of `text`. */
  comment(text: string): this {
    for (const l of String(text).split('\n')) this.line(l ? `${this.commentPrefix} ${l}` : this.commentPrefix)
    return this
  }

  /**
   * `header` and, one level in, what `body` writes. A body that writes nothing but comments gets
   * the writer's `emptyBlock` line, so the block stays valid.
   */
  block(header: string, body: (w: this) => void): this {
    this.line(header)
    this.depth++
    const before = this.out.length
    body(this)
    if (this.emptyBlock && !hasCode(this.out.slice(before), this.commentPrefix)) this.line(this.emptyBlock)
    this.depth--
    return this
  }

  /** What `body` writes, one level in, with no header. */
  indent(body: (w: this) => void): this {
    this.depth++
    body(this)
    this.depth--
    return this
  }

  /** Whether nothing has been written. */
  get isEmpty(): boolean {
    return this.out.every((l) => l === '')
  }

  /** The lines written so far, without the trailing newline. */
  toLines(): string[] {
    return [...this.out]
  }

  /** The file: lines joined, ending with one newline. */
  toString(): string {
    const lines = [...this.out]
    while (lines.length && lines[lines.length - 1] === '') lines.pop()
    return lines.join('\n') + '\n'
  }
}

/** Whether `lines` hold anything but blank lines and comments: a block of only comments is empty. */
export function hasCode(lines: string[], commentPrefix = '#'): boolean {
  return lines.some((l) => {
    const t = l.trim()
    return t !== '' && !t.startsWith(commentPrefix)
  })
}

/** `lines`, each prefixed with `by`. */
export function indentLines(lines: string[], by = '    '): string[] {
  return lines.map((l) => (l ? by + l : l))
}

export default { ScriptWriter, indentLines, hasCode }
