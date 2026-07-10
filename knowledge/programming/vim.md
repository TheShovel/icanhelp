# Vim / Neovim

## Modes
- **Normal** — navigate and manipulate text (`Esc` or `Ctrl-[`)
- **Insert** — type text (`i`, `a`, `o`, `I`, `A`, `O`)
- **Visual** — select text (`v` char, `V` line, `Ctrl-v` block)
- **Command-line** — run Ex commands (`:`, `/`, `?`)
- **Replace** — overwrite characters (`R`)

## Essential Navigation
```
h j k l     ← ↓ ↑ →   (also arrow keys)
w / b       word forward / back
e / ge      end of word forward / back
0 / $       start / end of line
^           first non-blank character
gg / G      start / end of file
{ / }       paragraph / block up / down
Ctrl-d/u    half page down / up
Ctrl-f/b    full page down / up
%           matching bracket
gd          go to definition (local)
gf          go to file under cursor
```

## Editing
```
x           delete character
dd / D      delete line / delete to end of line
yy / Y      yank (copy) line
p / P       paste after / before cursor
u / Ctrl-r  undo / redo
.           repeat last change
>> / <<     indent / dedent line
J           join lines
r{char}     replace character
~           toggle case
ciw         change inner word (delete word, enter insert)
ci{/ci(/ci" change inside brackets/parens/quotes
dit         delete inside HTML tag
```

## Searching
```
/pattern    search forward
?pattern    search backward
n / N       next / previous match
* / #       search word under cursor forward / backward
:s/old/new/g  substitute in line
:%s/old/new/g substitute in file
:%s/old/new/gc  substitute with confirmations
```

## Registers
```
"ayy        yank line into register a
"ap         paste from register a
"ayiw       yank inner word into register a
"ad3j       delete 3 lines into register a
""          unnamed register (default)
"0          last yank
"+          system clipboard
"*          selection clipboard
Ctrl-r "    in insert mode, paste from register
```

## Marks
```
m{a-z}      set mark
`{a-z}      jump to mark
'{a-z}      jump to start of marked line
'.          jump to last change
``          jump back to previous position
```

## Buffers, Windows, Tabs
```
:ls / :buffers   list buffers
:bnext / :bprev  next/previous buffer
:b {name/N}      switch to buffer
:bd              close buffer

Ctrl-w s     split horizontal
Ctrl-w v     split vertical
Ctrl-w w     switch panes
Ctrl-w q     close pane
Ctrl-w hjkl  navigate panes

:tabnew      new tab
:tabnext/prev / gt/gT
```

## Config (init.lua — Neovim)
```lua
-- Options
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.tabstop = 2
vim.opt.shiftwidth = 2
vim.opt.expandtab = true
vim.opt.termguicolors = true
vim.opt.ignorecase = true
vim.opt.smartcase = true
vim.opt.mouse = 'a'
vim.opt.clipboard = 'unnamedplus'

-- Lazy.nvim plugin manager
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"

-- Keymaps
vim.keymap.set("n", "<leader>w", ":w<CR>")
vim.keymap.set("n", "<leader>q", ":q<CR>")
vim.keymap.set("n", "<leader>e", vim.diagnostics.open_float)
```

## Essential Plugins (Neovim)
- **lazy.nvim** — plugin manager (deferred loading)
- **telescope.nvim** — fuzzy finder (files, grep, buffers, help)
- **nvim-treesitter** — better syntax highlighting, text-objects
- **nvim-lspconfig** — LSP client config
- **mason.nvim** — LSP/DAP/linter installer
- **which-key.nvim** — shows keybinding popups
- **gitsigns.nvim** — git decorations in gutter
- **oil.nvim** — file explorer as a buffer
- **mini.pairs** / **nvim-autopairs** — auto-close brackets
- **Comment.nvim** — easy commenting

## Tips
- `Ctrl-[` = Escape (keep fingers on home row)
- `Ctrl-r` in command mode inserts from register
- `q:` opens command-line history window
- `ga` shows hex/unicode value of character under cursor
- `g;` `g,` jump to last/next change location
- `zz` `zt` `zb` center/top/bottom cursor on screen
- Use `netrw` (`:Ex`): built-in file explorer
- To learn interactively: run `vimtutor`
