# Bash Scripting

Reference for writing bash scripts. For interactive command-line usage see
`shell-mastery.md`. All snippets below are POSIX-ish bash and tested.

## Shebang & Basics
```bash
#!/usr/bin/env bash
set -euo pipefail   # exit on error, unset var, pipe failure
```
- `set -x` — print commands as executed (debug)
- `bash -n script.sh` — syntax check without running
- `trap 'cleanup' EXIT` — run on exit; `trap 'cleanup' ERR INT TERM` — on signals

## Variables & Quoting
```bash
var="value"                 # no spaces around =
"$var"                      # preserves whitespace, prevents globbing (always quote)
${var:-default}             # value if unset/empty
${var:=default}             # assign default if unset/empty
${var:+alt}                 # alt if set
${var:?msg}                 # error if unset/empty
${#var}                     # length
${var/old/new}              # replace first; ${var//old/new} replace all

arr=(one two three)
echo ${arr[0]} ${arr[@]} ${#arr[@]}   # first / all / count
```

## Expansion
```bash
$(cmd)              # command substitution (preferred over backticks)
$((a + b))          # arithmetic
{1..10} {a,b,c}     # brace expansion
*.txt               # glob
```

## Conditionals
```bash
[[ -f f ]]   # regular file      [[ -d d ]]   # directory
[[ -e p ]]   # exists            [[ -x f ]]   # executable
[[ -r f ]]   # readable          [[ -w f ]]   # writable
[[ -L l ]]   # symlink           [[ -s f ]]   # non-empty
[[ -z "$s" ]] # empty            [[ -n "$s" ]] # non-empty
[[ "$a" == "$b" ]]  # equal      [[ "$a" != "$b" ]]  # not equal
[[ "$a" < "$b" ]]   # lexicographic
[[ "$a" =~ regex ]] # regex match
(( a < b ))         # arithmetic comparison

# Numeric: -eq -ne -lt -le -gt -ge
# Logical: [[ a && b ]]  [[ a || b ]]  [[ ! a ]]
```

## Control Flow
```bash
if [[ cond ]]; then
  cmds
elif [[ cond ]]; then
  cmds
else
  cmds
fi

for i in a b c; do cmds; done
for ((i=0; i<10; i++)); do cmds; done
while [[ cond ]]; do cmds; done
until [[ cond ]]; do cmds; done

case $var in
  pat1) cmds ;;
  pat2) cmds ;;
  *)    cmds ;;
esac
```

## Functions
```bash
my_func() {
  local arg1=$1
  local arg2=${2:-default}
  echo "Args: $arg1, $arg2"
  return 0          # exit code
}
my_func "hello" "world"
echo $?             # last exit code
```

## Special Variables
```bash
$0 $1 ...   # script name, args
$#          # arg count
$@          # all args (separate words)
$*          # all args (single word)
$$          # current PID
$?          # last exit code
```

## Useful One-Liners
```bash
history | awk '{print $2}' | sort | uniq -c | sort -rn | head   # most-used cmds
du -sh * | sort -h                                                # dir sizes
find . -type f -name '*.log' -exec truncate -s 0 {} +            # empty logs
xargs -P4 -I{} cmd {}                                            # parallel exec
ssh user@host 'bash -s' < script.sh                              # run script remote
```
