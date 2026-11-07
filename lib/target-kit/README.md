# target-kit

What every scripting target needs, whatever language it writes. Use it to build a target for
Skript, a plugin of your own, or anything else (see the SDK guide, *Scripting targets*). It has no
dependencies and doesn't import `sdk`, so you can test it on its own.

```ts
import { spellings, guiLayout, guiLogic, buttonAction, createReport, type Bundle } from 'target-kit'
```

## Bundle types

`Bundle`, `Mechanic`, `Gui`, `GuiElement`, `GuiLogicTrigger`, `Step`, `Catalog`, `CompiledFile`:
the shape `compile(bundle, { catalog })` receives.

## Spelling tables

One entry per thing the editors offer. A step is spelled from your table first. If it isn't there,
the catalog entry's `targets[yourId]` template is used (entries other expansions add). Anything else
is reported.

```ts
const actions = spellings<Ctx, string[]>({
  Narrate: (p, ctx) => [`send ${ctx.text(p.message)} to player`]
})

const result = actions.spell(step, ctx, { targetId: 'skript', entry: catalog.mechanics.actions[step.command] })
if (result.ok) lines.push(...result.value)
else report.warn(result.reason)

actions.coverage(catalog.mechanics.actions, 'skript')   // { spelled: [...], missing: [...] }
```

## GUIs

```ts
const layout = guiLayout(gui)
layout.buttons      // [{ id, element, cells: [13, 14] }]   every cell a button covers
layout.slots        // [{ slotId, index, returnOnClose, element }]   item slots
layout.cells[i]     // { kind: 'button', button } | { kind: 'slot', slot } | null

const logic = guiLogic(gui, layout)
logic.open, logic.close                    // Step[]
logic.buttonClick.get('buy')               // Step[] for that button
logic.slotChange.get('payment')            // Step[] after that slot changes
logic.other, logic.dangling                // to spell or report

buttonAction(element)   // { kind: 'commands', commands } | { kind: 'gui', gui } | null
itemRef('nexo:ruby')    // { custom: true, id: 'ruby' }
```

## Text

| | |
| --- | --- |
| `fill(template, params)`, `fillLines(template, params)` | `{param}` templates, same rules as the app |
| `placeholders(text, values)` | `{player}`-style placeholders in user-written text, such as a button's command |
| `createReport(scope)` | Collects warnings: `warn(msg)`, `scope(name)`, `warnings` |
| `walkSteps(steps)` | Every step of a program, flat |
