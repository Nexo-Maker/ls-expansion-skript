/** The Mechanics editor's conditions (If True / If False cards) as Skript conditions. */

import { spellings } from 'target-kit'
import type { Condition } from '../steps'
import { count } from 'skript-lang'
import { playerOf, say, vanillaItem, type Ctx } from '../context'

/** Skript compares with `is` / `is not` and the symbols (`is at least` is not a comparison). */
const OPERATORS: Record<string, string> = {
  '=': 'is',
  '==': 'is',
  is: 'is',
  equals: 'is',
  '!=': 'is not',
  '≠': 'is not',
  not: 'is not',
  '>': '>',
  '<': '<',
  '>=': '>=',
  '≥': '>=',
  '<=': '<=',
  '≤': '<='
}

/** A compared value: a number stays a number, anything else is text. */
const operand = (ctx: Ctx, value: unknown) => {
  const v = String(value ?? '').trim()
  if (/^-?\d+(\.\d+)?$/.test(v)) return v
  const only = /^<([^<>\s]+)>$/.exec(v)?.[1]
  const expr = only ? ctx.resolve(only) : undefined
  return expr ?? say(ctx, v)
}

export const CONDITIONS = spellings<Ctx, Condition>({
  IsSneaking: (_p, ctx) => `${playerOf(ctx)} is sneaking`,
  IsFlying: (_p, ctx) => `${playerOf(ctx)} is flying`,
  IsOnGround: (_p, ctx) => `${playerOf(ctx)} is on ground`,
  HasPermission: (p, ctx) => `${playerOf(ctx)} has permission "${String(p.permission || 'my.permission').replace(/"/g, '')}"`,
  IsInWorld: (p, ctx) => `name of world of ${playerOf(ctx)} is "${String(p.world || 'world').replace(/"/g, '')}"`,
  HasItem: (p, ctx) => `${playerOf(ctx)} has ${count(p.amount, 1)} of ${vanillaItem(p.item)}`,
  IsHolding: (p, ctx) => `tool of ${playerOf(ctx)} is ${vanillaItem(p.item)}`,
  IsBlock: (p) => `event-block is ${vanillaItem(p.block)}`,
  CompareValue: (p, ctx) => `${operand(ctx, p.value)} ${OPERATORS[String(p.operator || '=').trim()] || 'is'} ${operand(ctx, p.expected)}`
})
