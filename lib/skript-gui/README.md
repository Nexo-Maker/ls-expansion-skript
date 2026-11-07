# skript-gui

Chest GUIs in Skript, with item slots that behave like a chest. You describe the GUI as data plus
the Skript each moment runs, and you get back a complete `.sk` file. It depends on
[script-writer](../script-writer/README.md) and [skript-lang](../skript-lang/README.md) and knows
nothing about Lode Studio, so any expansion that writes Skript can use it. Checked on Skript 2.16
and Paper.

```ts
import { chestGui, guiNames } from 'skript-gui'
import { quote } from 'skript-lang'

const source = chestGui({
  id: 'shop',
  prefix: 'myexp',                         // your own, so GUIs from different expansions never collide
  titleLiteral: quote('Shop'),
  rows: 3,
  buttons: [
    { id: 'buy', cells: [13], item: 'emerald named "Buy"', onClick: ['send "Thanks!" to {_p}'] }
  ],
  slots: [
    { id: 'payment', index: 11, returnOnClose: true, onChange: ['send "Payment changed" to {_p}'] }
  ],
  onOpen: ['play sound "UI_BUTTON_CLICK" to {_p}'],
  onClose: []
})

guiNames({ id: 'shop', prefix: 'myexp' }).open   // 'myexp_shop_open': call it with a player
```

## What the generated script does

- **A fresh copy per open.** Each player gets their own inventory, so players never share or
  steal items.
- **Buttons are fixed.** A click is cancelled and runs the button's `onClick` lines.
- **Item slots work like a chest.** Players can place, take, swap and split items there, and use
  number keys. A tick after a slot changes, its `onChange` lines run. Shift-clicking an item in the
  player's own inventory moves it into the first empty item slot, or nowhere.
- **Every other cell is fixed.** Double-click collecting is cancelled while the GUI is open,
  because it could pull button items out. Drags are allowed over item slots and the player's own
  inventory only. Clicks outside the window still drop the cursor item.
- **Closing.** On close, the `onClose` lines run, then whatever is left in item slots goes back to
  the player (dropped at their feet if their inventory is full). A slot with
  `returnOnClose: false` doesn't give its items back.

## Inside your lines

| | |
| --- | --- |
| `{_p}` | the player |
| `{_inv}` | this player's copy of the GUI |
| `{_slot}` | in `onClick`: the cell that was clicked (0-based) |

Each moment is a function, so `wait` works in any of them.

## Names

`guiNames(spec)` gives you `open` (`<prefix>_<id>_open(p: player)`), the per-moment functions, and
`tag`, the metadata tag on a player that holds the id of the GUI they have open.
`openGui(spec, 'player')` writes the call.

## Limits

- A shift-click moves an item only into an **empty** item slot. It doesn't top up a partial stack
  of the same item.
- A drag that touches any fixed cell of the GUI is cancelled as a whole.
