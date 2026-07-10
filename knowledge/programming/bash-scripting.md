# Advanced Bash Scripting

## Strict Mode
```bash
#!/bin/bash
set -euo pipefail   # exit on error, undefined vars, pipe failures
IFS=$'\n\t'         # safer word splitting
```

## Variable Handling
- Default values: `${VAR:-default}` (if unset/null) or `${VAR:=default}` (and assign)
- Substring removal: `${VAR#prefix}` `${VAR%suffix}` `${VAR##glob}` `${VAR%%glob}`
- Substring extraction: `${VAR:offset:length}`
- Case modification: `${VAR,,}` (lower), `${VAR^^}` (upper), `${VAR~}` (invert)
- Parameter expansion: `${!VAR}` (indirect reference)
- Length: `${#VAR}`

## Arrays
```bash
arr=("a" "b" "c")
echo "${arr[0]}"          # first element
echo "${arr[@]}"          # all elements (quoted, preserves spaces)
echo "${#arr[@]}"         # length
arr+=("d")                # append
for i in "${!arr[@]}"; do # iterate over indices
  echo "$i: ${arr[$i]}"
done
```

## File & String Operations
```bash
# File tests
[[ -f "$file" ]]    # exists and is regular file
[[ -d "$dir" ]]     # exists and is directory
[[ -z "$str" ]]     # string is empty
[[ -n "$str" ]]     # string is non-empty
[[ "$a" == "$b" ]]  # string equality (globs allowed on right)
[[ "$a" =~ regex ]] # regex match (no quotes around regex)

# Read file line by line
while IFS= read -r line; do
  echo "$line"
done < "$file"
```

## Functions
```bash
func_name() {
  local arg1="$1"    # local scope, first arg
  shift              # pop first arg
  local remaining=("$@")
  return 0           # explicit return code (0-255)
}
```

## Error Handling & Logging
```bash
log()  { echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" >&2; }
die()  { log "FATAL: $*"; exit 1; }
warn() { log "WARN: $*"; }

# Trap exits and errors
cleanup() { rm -f /tmp/tmpfile; }
trap cleanup EXIT
trap 'log "Error on line $LINENO"' ERR
```

## Common One-Liners
```bash
# Find and replace in files
sed -i 's/old/new/g' file.txt

# Get directory of this script
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if command exists
command -v jq >/dev/null 2>&1 || die "jq required"

# Parallel execution with xargs
find . -name "*.log" -print0 | xargs -0 -P 4 -I {} gzip {}

# Read command output into array
mapfile -t lines < <(some_command)

# Get script name without path
SCRIPT_NAME="${BASH_SOURCE[0]##*/}"
```

## Security Practices
- Quote all variable expansions: `"$var"`, `"${arr[@]}"`
- Use `printf` instead of `echo` for arbitrary strings: `printf '%s\n' "$var"`
- Never eval user input
- Use `read -r` to prevent backslash interpretation
- Validate inputs with regex or case statements before using in filesystem ops
