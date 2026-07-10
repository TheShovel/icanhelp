# Regular Expressions (Regex)

## Syntax
- `.` — any single character (except newline)
- `\d` — digit (0-9). `\D` — not digit
- `\w` — "word" char (a-z, A-Z, 0-9, _). `\W` — not word
- `\s` — whitespace (space, tab, newline). `\S` — not whitespace
- `^` — start of string. `$` — end of string
- `\b` — word boundary. `\B` — not word boundary
- `*` — 0 or more. `+` — 1 or more. `?` — 0 or 1
- `{3}` — exactly 3. `{2,5}` — 2 to 5. `{3,}` — 3 or more
- `[...]` — character class: `[aeiou]` any vowel, `[a-z]` any lowercase, `[^...]` negated
- `(...)` — capture group. `(?:...)` — non-capturing group
- `|` — alternation (OR): `cat|dog` matches either
- `\` — escape special character: `\.` matches literal dot

## Common Patterns
```
# Email (simplified)
[\w.-]+@[\w.-]+\.\w{2,}

# URL
https?://[\w./?=&-]+

# Phone (US)
\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}

# IPv4
\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}

# Date YYYY-MM-DD
\d{4}-\d{2}-\d{2}

# Time HH:MM (24h)
([01]\d|2[0-3]):[0-5]\d

# Hex color (#RRGGBB)
#[0-9a-fA-F]{6}

# HTML tag
<[^>]+>

# Whitespace trim
^\s+|\s+$

# Number with commas (thousands separator)
\d{1,3}(,\d{3})*(\.\d+)?

# Password (8+ chars, uppercase, lowercase, digit)
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$
```

## In Editors
- VS Code: `Ctrl+H` → `.*` toggle => regex search/replace
- `$1`, `$2` in replacement = captured groups
- E.g., `(\w+) (\w+)` → `$2, $1` swaps "first last" to "last, first"
- Vim: `:%s/pattern/replacement/g`
- Sed: `sed -E 's/pattern/replacement/g' file`

## Lookahead/Lookbehind (PCRE)
- `(?=...)` — positive lookahead: matches if followed by...
- `(?!...)` — negative lookahead: matches if NOT followed by...
- `(?<=...)` — positive lookbehind: matches if preceded by...
- `(?<!...)` — negative lookbehind: matches if NOT preceded by...
- Example: `\d+(?=px)` matches "42" in "42px" but not "42em"
- Example: `(?<=\$)\d+` matches "42" in "$42" but not "42"
- JavaScript: lookbehind supported since ES2018
- Not supported in all regex engines (check before use)

## Greedy vs Lazy
- `.*` is greedy (tries to match as much as possible)
- `.*?` is lazy (tries to match as little as possible)
- `<div>.*</div>` would match from first `<div>` to LAST `</div>`
- `<div>.*?</div>` matches from first `<div>` to NEXT `</div>`

## Flags
- `g` — global (find all matches, not just first)
- `i` — case insensitive
- `m` — multiline (`^` and `$` match line starts/ends)
- `s` — dotall (`.` matches newlines)
- `u` — unicode (enables `\p{...}` unicode property escapes)
- `y` — sticky (match only at lastIndex position)

## Language Specifics
- **JavaScript**: `str.match(/pattern/gi)`, `str.replace(/pat/g, 'repl')`, `/pat/.test(str)`
- **Python**: `re.findall(r'pattern', str)`, `re.sub(r'pat', 'repl', str)`, `re.search()`
- **Java**: `Pattern.compile("pattern")`, `matcher.find()`, `matcher.group(1)`
- **Go**: `regexp.MustCompile(\`pattern\`)`, `re.FindString(str)`
- **Bash**: `grep -E 'pattern'`, `sed -E 's/pat/repl/g'`, `[[ str =~ pattern ]]`
