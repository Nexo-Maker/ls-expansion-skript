# skript-lang

Writing Skript from code. Every table here was checked against Skript 2.16 and 2.17 on a Paper server.
Depends on [script-writer](../script-writer/README.md).

```ts
import { skriptWriter, text, quote, tokenResolver, EVENTS, itemName, timespan } from 'skript-lang'
```

## Strings

| | |
| --- | --- |
| `quote(value)` | A plain string literal: `"` and `%` escaped, nothing interpreted |
| `text(value, { resolve, onUnknown })` | User text with variable tokens: `'Hi <player.name>'` → `"Hi %player%"`. Formatting tags such as `<red>` and `<glyph:...>` pass through. Tokens without an expression are kept as written and handed to `onUnknown`. |
| `tokenResolver(player, extra)` | A `resolve` over `TOKENS` for a context: `player` is the expression for the player there (`'player'` in an event, `'{_p}'` in a function, `null` when there is none) |
| `reference(value, resolve)` | A value meant as an object (`player`, `<context.entity>`) as an expression |

`TOKENS` maps each variable the app's editors offer (`player.name`, `context.location`, ...) to its
Skript expression, with `{p}` standing for the player. Variables that only exist in one event
(`context.slot` in an inventory click) are that event's own `tokens` instead, so Skript never sees
them where it would refuse them. `NO_SKRIPT` lists the variables with no Skript expression at all,
each with the reason.

## Events

`EVENTS['player.joins']` → `{ line: 'on join', player: 'player' }`. Each entry has the event line,
the expression for its player (or `null`), `setup` lines the body starts with, and `tokens` that
only hold in that event (`victim` in damage events). The keys are the Mechanics catalog's trigger
keys; a trigger missing here has no Skript event.

## Values

`itemName('minecraft:diamond_sword')` → `diamond sword` · `entityName` · `timespan('10s')` →
`10 seconds` · `number(v, fallback)` · `count(v, fallback, min)` · `ident('my-gui')` → `my_gui` ·
`sound('ui.button.click')` → `UI_BUTTON_CLICK`

## Files

`skriptWriter()` gives a [ScriptWriter](../script-writer/README.md) with four-space indentation,
`#` comments, and `stop` in sections that would otherwise be empty. `fileHeader(w, what, by)` writes
the standard "generated, don't edit" header.
