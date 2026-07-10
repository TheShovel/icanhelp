# Lua

Lua is a lightweight, embeddable scripting language popular in gaming and configuration.

## Key Features
- **Small footprint**: ~200KB binary, embeddable in any C/C++ application
- **Dynamic typing**: No type declarations — `local x = 10; x = "hello"` is valid
- **Tables as universal data structure**: Arrays `{1, 2, 3}`, maps `{key = "value"}`, objects `obj.method()`
- **1-indexed**: Arrays start at 1, not 0 — `arr[1]` is first element
- **Multi-returns**: Functions can return multiple values: `function xy() return 1, 2 end; local a, b = xy()`
- **First-class functions**: Functions are values — assigned to variables, passed as arguments, returned

## Tables Deep
- **Table as array**: `local t = {10, 20, 30}` — keys are 1, 2, 3 automatically; `#t` gives length (3)
- **Table as dictionary**: `local t = {name = "John", age = 30}` — string keys; accessed `t.name` or `t["name"]`
- **Mixed tables**: `{1, 2, key = "val", 3}` — ordering reflects assignment order
- **Metatables**: Custom behavior — `setmetatable(t, {__index = fallback})` for inheritance-like lookup
- **Metamethods**: `__index` (read fallback), `__newindex` (write hook), `__add` (custom +), `__call` (make table callable), `__tostring` (string representation)

## Control Flow
- **Conditional**: `if condition then ... elseif condition then ... else ... end`
- **Loops**: `while condition do ... end`, `repeat ... until condition`, `for i = start, stop, step do ... end`
- **Generic for**: `for key, value in pairs(t) do ... end`, `for index, value in ipairs(t) do ... end`
- **No `continue`**: Use `goto` label (Lua 5.2+) or wrap in `repeat ... until true` block

## Functions
- **Function declaration**: `function add(a, b) return a + b end` — sugar for `add = function(a, b) ...`
- **Variable arguments**: `function sum(...) local args = {...}; for i, v in ipairs(args) do ... end`
- **Closures**: Functions capturing local variables — `function makeCounter() local c = 0; return function() c = c + 1; return c end`
- **Tail calls**: `return f(args)` — tail recursion optimized, no stack growth

## Coroutines
- **Threads, not preemptive**: `co = coroutine.create(function() ... end)` — cooperative multitasking
- **States**: `coroutine.resume(co, args)` — runs until yield or return; `coroutine.yield(val)` — suspends, returns to resume caller
- **Status**: `coroutine.status(co)` — `"suspended"`, `"running"`, `"normal"`, `"dead"`
- **Producer/consumer pattern**: Classic use case — yield produces, resume consumes

## Standard Libraries
- **string**: `string.sub(s, i, j)`, `string.find(s, pattern)`, `string.gsub(s, pattern, repl)`, `string.match`, `string.gmatch`
- **table**: `table.insert(t, val)`, `table.remove(t, pos)`, `table.sort(t, comp)`, `table.concat(t, sep)`, `table.pack/unpack`
- **math**: `math.random`, `math.floor/ceil`, `math.sin/cos/tan`, `math.abs`, `math.sqrt`, `math.max/min`
- **io**: `io.open(filename, mode)`, `file:read("*all")`, `file:write("content")`, `io.lines(filename)`
- **os**: `os.date(format)`, `os.time()`, `os.clock()` (CPU time), `os.execute(cmd)` (shell command)
- **debug**: `debug.traceback()`, `debug.getinfo()`, `debug.getlocal()` — introspection

## Embedding in C
- **API**: `lua_State *L = luaL_newstate()` — create interpreter; `luaL_dofile(L, "script.lua")` — run file
- **Stack**: Lua uses a stack for C↔Lua communication — `lua_pushnumber(L, 42)`, `lua_pop(L, 1)`
- **C functions for Lua**: `static int myFunc(lua_State *L) { ... return nresults; }` — register with `lua_register`
- **Userdata**: C structs accessible from Lua — `lua_newuserdata` for full lifetime control

## Tools
- **LuaRocks**: Package manager — `luarocks install lpeg` for parser, `luarocks install luaunit` for testing
- **LÖVE**: 2D game framework — uses Lua for scripting, popular for prototypes
- **LuaJIT**: Just-in-time compiler — ~10x faster than PUC Lua for numeric code, FFI for C interop
