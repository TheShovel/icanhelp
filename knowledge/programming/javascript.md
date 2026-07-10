# JavaScript & Node.js

## Core JavaScript
- `var`, `let`, `const` — var (function scope), let (block scope), const (block scope, no reassignment)
- Types: `string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`, `object`
- `===` / `!==` — strict equality (no type coercion)
- `==` / `!=` — loose equality (coerces types, avoid)
- Truthy: `true`, `1`, `"string"`, `[]`, `{}`, `Infinity`
- Falsy: `false`, `0`, `""`, `null`, `undefined`, `NaN`
- `typeof` — returns type string ("undefined", "object" for null, "function")
- `instanceof` — checks prototype chain

## Array Methods
```js
arr.push(val)            // add end
arr.pop()                // remove end
arr.unshift(val)         // add front
arr.shift()              // remove front
arr.slice(1, 3)          // shallow copy [1,3)
arr.splice(1, 1, val)    // remove/replace in-place
arr.concat(other)        // combine arrays
arr.join(",")            // to string
arr.indexOf(val)         // first index (-1 if none)
arr.includes(val)        // boolean
arr.find(fn)             // first element matching fn
arr.filter(fn)           // new array with matches
arr.map(fn)              // transform each element
arr.reduce(fn, init)     // accumulate
arr.some(fn)             // any match?
arr.every(fn)            // all match?
arr.sort([fn])           // in-place sort (default: string order!)
arr.reverse()            // in-place reverse
arr.flat(depth)          // flatten nested arrays
arr.flatMap(fn)          // map then flatten(1)
[...arr]                 // spread (shallow copy)
Array.from(iterable)     // from iterable/array-like
Array.isArray(arr)       // check if array
```

## Object Methods
```js
Object.keys(obj)         // array of own keys
Object.values(obj)       // array of own values
Object.entries(obj)      // array of [key, value]
Object.fromEntries(arr)  // from [key,value] pairs
Object.assign(target, src) // merge properties
{...obj}                 // shallow spread copy
obj?.prop                // optional chaining
obj?.method?.()          // optional method call
const {a, b} = obj       // destructuring
const {a: alias} = obj   // destructure with alias
const {a = 5} = obj      // destructure with default
delete obj.prop          // remove property
'prop' in obj            // check property exists
```

## Functions
```js
// Arrow functions (no own this/arguments/super)
const add = (a, b) => a + b
const square = x => x * x

// Default params
function greet(name = "World") { ... }

// Rest params
function sum(...nums) { return nums.reduce((a,b)=>a+b, 0) }

// Spread
const copy = [...arr]
const merged = {...obj1, ...obj2}

// Closure
function counter() {
  let count = 0
  return () => ++count
}
```

## Promises & Async
```js
// Create
new Promise((resolve, reject) => {
  resolve(value)  // success
  reject(error)   // failure
})

// Consume
promise.then(val => ...).catch(err => ...).finally(() => ...)

// Parallel
Promise.all([p1, p2])              // all resolve (fail fast)
Promise.allSettled([p1, p2])       // all settle
Promise.race([p1, p2])             // first to settle
Promise.any([p1, p2])              // first to resolve

// Async/await
async function fetchData() {
  try {
    const res = await fetch(url)
    return await res.json()
  } catch (e) {
    console.error(e)
  }
}
```

## Node.js Core
```js
// Modules
const fs = require("fs")
const path = require("path")
const os = require("os")
import { readFile } from "fs/promises"  // ESM

// File system (sync)
fs.readFileSync("/path", "utf8")
fs.writeFileSync("/path", "content")
fs.existsSync("/path")
fs.mkdirSync("/path", { recursive: true })
fs.statSync("/path")       // file info (size, mtime, mode, isDirectory(), isFile())

// File system (async)
fs.promises.readFile("/path", "utf8")
fs.promises.writeFile("/path", "content")

// Path
path.join("dir", "file")   // platform-safe join
path.resolve("dir", "file") // absolute path
path.basename("/path/to/file.js")  // "file.js"
path.dirname("/path/to/file.js")   // "/path/to"
path.extname("file.js")            // ".js"
path.parse("/path/file.js")        // { root, dir, base, name, ext }

// OS
os.homedir()          // user home
os.tmpdir()           // temp directory
os.platform()         // "linux", "darwin", "win32"
os.cpus()             // CPU info
os.freemem()          // free memory bytes
os.totalmem()         // total memory bytes
os.arch()             // "x64", "arm64"
os.hostname()         // system hostname

// Process
process.cwd()                // current working directory
process.env.HOME             // environment variable
process.argv                 // CLI arguments
process.exit(code)           // exit with code
process.on("uncaughtException", fn)
process.on("SIGINT", fn)     // Ctrl+C handler
```

## Common npm Packages
- `express` — web framework
- `electron` — desktop apps
- `node-llama-cpp` — local LLM inference
- `@xenova/transformers` — transformer models in JS
- `marked` — markdown parser
- `tesseract.js` — OCR
- `chokidar` — file watching
- `ws` — WebSocket
- `better-sqlite3` — SQLite binding
- `sharp` — image processing
- `commander` / `yargs` — CLI argument parsing
- `dotenv` — .env file loading
- `node-fetch` or built-in `fetch` (Node 18+)
- `zod` — schema validation
- `bcrypt` — password hashing
- `jsonwebtoken` — JWT

## CommonJS vs ESM
- CommonJS: `require()`, `module.exports`, `.js` extension
- ESM: `import`/`export`, `.mjs` or `"type": "module"` in package.json
- Mixing: dynamic import `import('esm-module')` in CJS
