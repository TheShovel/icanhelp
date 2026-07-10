# Essential CLI Tools

## File Search & Content
- `find . -name "*.py" -exec grep -l "TODO" {} +` — find files containing pattern
- `fd` — faster find: `fd -e py -H` (search .py including hidden)
- `rg "pattern" --type py` — ripgrep, faster grep by file type
- `rg -l "TODO" -g "*.js"` — list files matching in JS
- `locate updatedb && locate filename` — instant file lookup (needs `sudo updatedb`)
- `fzf` — fuzzy finder: `kill $(fzf)` interactive process killer

## JSON Processing
- `cat file.json | jq '.users[].name'` — extract names
- `jq '.[] | select(.age > 30)' data.json` — filter objects
- `jq -r '.[] | [.name, .email] | @tsv' data.json` — output as TSV
- `jq --arg key val '.[$key] = "new"' file.json` — add/modify field
- `jq -s 'group_by(.type)' *.json` — group JSON array files
- `curl -s api.com/endpoint | jq '.results[0].id'` — one-liner API fetch

## CSV/Text Processing
- `awk -F',' '{print $2}' file.csv` — second column
- `cut -d',' -f1,3 file.csv` — columns 1 and 3
- `sort -t',' -k3 -n file.csv` — sort by third numeric column
- `uniq -c | sort -rn` — count and rank duplicates: `history | awk '{print $1}' | sort | uniq -c | sort -rn`
- `column -t -s',' file.csv` — align CSV nicely

## Clipboard & Quick Tasks
- `xclip -selection clipboard < file` — copy file to clipboard
- `xclip -o` — paste from clipboard
- `pbcopy` / `pbpaste` — macOS clipboard
- `watch -n1 command` — run command every second
- `yes | command` — auto-accept prompts
- `script -c "command" log.txt` — record terminal session
- `tskill x` — kill X process by name

## Disk & System
- `lsof +D /path` — what's using a directory
- `lsof -i :8080` — what's using a port
- `strace -p PID` — trace system calls
- `ltrace -p PID` — trace library calls
- `dd if=/dev/zero of=/dev/null bs=1M count=1024` — benchmark disk

## Process Management
- `pgrep -a pattern` — find process with args
- `pkill -f "python server.py"` — kill by pattern
- `renice -n -5 -p PID` — give process more CPU
- `nohup command &` — run command after logout
- `disown %1` — remove job from shell

## Git Helpers
- `git log --oneline -20 --graph --all` — visual branch history
- `git stash && git checkout branch && git stash pop` — quick context switch
- `git rebase -i HEAD~5` — interactive rebase last 5 commits
- `git reflog` — find lost commits
- `git bisect start && git bisect bad HEAD && git bisect good v1.0` — binary search bugs

## Text Manipulation
- `sed -i 's/old/new/g' file` — in-place replace
- `sed -n '10,20p' file` — print lines 10-20
- `awk '/pattern/ {print NR": "$0}' file` — print matching lines with line numbers
- `grep -oP '(?<=src=")[^"]+' file` — extract values from HTML/XML
- `perl -pe 's/\t/    /g' file` — convert tabs to spaces

## Docker Quick Commands
- `docker ps -a --format "table {{.Names}}\t{{.Status}}"` — formatted container list
- `docker exec -it $(docker ps -q) bash` — exec into first container
- `docker logs --tail 50 --follow CONTAINER` — watch logs
- `docker system df` — disk usage
- `docker images --format "{{.Repository}}:{{.Tag}} {{.Size}}" | sort -k2 -h` — images by size
