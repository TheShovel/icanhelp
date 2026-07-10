# Bash & Shell Scripting

## Key Commands
- `man <cmd>` — manual page
- `info <cmd>` — GNU info page
- `which <cmd>` — locate a command binary
- `type <cmd>` — show how shell resolves a command
- `alias name='cmd'` — create an alias (add to ~/.bashrc to persist)
- `source <file>` — execute file in current shell context
- `exec <cmd>` — replace current shell with cmd

## File Operations
- `cp -r src dest` — recursive copy
- `mv src dest` — move/rename
- `rm -rf <dir>` — force recursive delete (dangerous)
- `ln -s target link` — create symbolic link
- `find /path -name '*.txt'` — find files by name
- `locate <name>` — fast file search (requires updatedb)
- `rsync -avz src/ dest/` — sync files over SSH
- `tar -czf archive.tar.gz dir/` — compress to tar.gz
- `tar -xzf archive.tar.gz` — extract tar.gz

## Text Processing
- `grep -r "pattern" /path` — recursive search
- `grep -i` — case insensitive
- `grep -l` — list matching filenames only
- `grep -c` — count matches
- `grep -n` — show line numbers
- `sed -i 's/old/new/g' file` — replace in-place
- `sed -n '/pattern/p'` — print matching lines
- `awk '{print $1}' file` — print first column
- `awk -F: '{print $1}'` — custom field separator
- `sort -n` — numeric sort
- `sort -u` — sort and deduplicate
- `uniq -c` — count consecutive duplicates
- `wc -l` — count lines
- `cut -d',' -f1` — cut fields by delimiter
- `head -n 20` — first 20 lines
- `tail -n 20` — last 20 lines
- `tail -f` — follow file (watch live)

## Redirection & Pipes
- `cmd > file` — stdout to file (overwrite)
- `cmd >> file` — stdout to file (append)
- `cmd 2> file` — stderr to file
- `cmd &> file` — both stdout and stderr
- `cmd1 | cmd2` — pipe stdout to cmd2
- `cmd < file` — read stdin from file
- `$(cmd)` — command substitution (capture output)
- `(cmd)` — subshell
- `{ cmd; }` — compound in current shell

## Job Control
- `cmd &` — run in background
- `jobs` — list background jobs
- `fg %1` — bring job 1 to foreground
- `bg %1` — resume job 1 in background
- `Ctrl+Z` — suspend foreground job
- `nohup cmd &` — immune to hup (survives logout)
- `disown %1` — remove job from table

## Variables & Expansion
- `var="value"` — assignment (no spaces around =)
- `$var` or `${var}` — variable expansion
- `${var:-default}` — default if unset
- `${var:=default}` — set default if unset
- `${var:?msg}` — error if unset
- `${var:+alt}` — alternate if set
- `$?` — exit code of last command
- `$$` — current PID
- `$0`, `$1`, ... — script name, first arg
- `$#` — number of args
- `$@` — all args as separate words
- `$*` — all args as single word
- `*.txt` — glob (expand to matching files)
- `{1..10}` — brace expansion

## Conditionals
```bash
if [[ condition ]]; then
  commands
elif [[ condition ]]; then
  commands
else
  commands
fi

# File tests
[[ -f file ]]  # exists and is regular file
[[ -d dir ]]   # exists and is directory
[[ -e path ]]  # exists (any type)
[[ -x file ]]  # executable
[[ -r file ]]  # readable
[[ -w file ]]  # writable
[[ -s file ]]  # non-empty
[[ -L file ]]  # symbolic link

# String tests
[[ -z "$str" ]]  # empty string
[[ -n "$str" ]]  # non-empty
[[ "$a" == "$b" ]]  # equal
[[ "$a" != "$b" ]]  # not equal
[[ "$a" < "$b" ]]   # lexicographic less
[[ "$a" > "$b" ]]   # lexicographic greater

# Numeric comparison (old test syntax)
[[ "$a" -eq "$b" ]]  # equal
[[ "$a" -ne "$b" ]]  # not equal
[[ "$a" -lt "$b" ]]  # less than
[[ "$a" -le "$b" ]]  # less or equal
[[ "$a" -gt "$b" ]]  # greater than
[[ "$a" -ge "$b" ]]  # greater or equal

# Logical operators
[[ cond1 && cond2 ]]  # AND
[[ cond1 || cond2 ]]  # OR
[[ ! cond ]]          # NOT
```

## Loops
```bash
for i in list; do commands; done
for ((i=0; i<10; i++)); do commands; done
while condition; do commands; done
until condition; do commands; done
```

## Functions
```bash
function name() {
  local var="scope"
  echo "$1 $2"  # positional args
  return 0      # exit code
}
```

## Debugging
- `set -x` — print commands before executing (xtrace)
- `set -e` — exit on error
- `set -u` — error on undefined variable
- `set -o pipefail` — pipe fails if any command fails
- `bash -n script.sh` — syntax check without running
- `trap 'cmd' EXIT` — run cmd on script exit
- `trap 'cmd' ERR` — run cmd on any error
- `trap 'cmd' INT` — run cmd on Ctrl+C

## One-Liners
- `history | awk '{print $2}' | sort | uniq -c | sort -rn | head` — most used commands
- `du -sh * | sort -h` — directory sizes sorted
- `find . -type f -name "*.log" -exec truncate -s 0 {} +` — empty all log files
- `watch -n 1 'cmd'` — run cmd every second
- `xargs -P4 -I{} cmd {}` — parallel execution
- `ssh user@host 'bash -s' < script.sh` — run local script remotely
