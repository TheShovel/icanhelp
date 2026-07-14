# Linux Shell & Command Line Mastery

Interactive command-line reference for a desktop user. For bash *scripting*
(shebang, conditionals, functions, error handling) see `bash.md`; for archives
see `compression-tools.md`; for processes see `processes.md`.

## Keybindings (bash/zsh, Emacs mode)
| Key | Action | Key | Action |
|-----|--------|-----|--------|
| `Ctrl+A` | Line start | `Ctrl+E` | Line end |
| `Ctrl+U` | Cut to start | `Ctrl+K` | Cut to end |
| `Ctrl+W` | Cut word back | `Ctrl+Y` | Paste (yank) |
| `Ctrl+L` | Clear screen | `Ctrl+R` | Reverse history search |
| `Ctrl+C` | Interrupt (SIGINT) | `Ctrl+Z` | Suspend (SIGTSTP) |
| `Ctrl+D` | EOF (exit shell) | `Alt+.` | Last arg of prev cmd |
| `!!` | Previous command | `!$` | Last arg of prev cmd |

`vi` mode: `set -o vi` (ESC normal, `i` insert, `:` command mode).

## Navigation & Directories
```bash
cd -              # Previous directory
cd ~user          # User's home
cd ../..          # Up two levels
pushd /path       # Push current, cd to path
popd              # Pop and return
dirs -v           # Show directory stack
```

## File Operations
```bash
ls -la                 # All, long format
ls -lh                 # Human-readable sizes
ls -lt                 # Newest first
ls -lS                 # Largest first
ls -d */               # Directories only
mkdir -p a/b/c         # Parents, no error if exists
cp -r src/ dest/       # Recursive copy
mv f.txt new.txt       # Rename / move
rm -i f.txt            # Interactive delete
rm -rf dir/            # Recursive force (DANGEROUS)
ln -s target link      # Symbolic link
ln f hard              # Hard link
trash f.txt            # Safer delete (trash-cli)
```

## Finding Files
```bash
fd pattern              # Modern find (case-insensitive by default)
fd -e py pattern        # Only .py files
fd -H pattern           # Include hidden
find . -name '*.py'     # Traditional find
find . -size +100M      # Files > 100MB
find . -mtime -7        # Modified in last 7 days
find . -name '*.txt' -not -path '*/sub/*'
locate pattern          # DB-backed fast search (needs updatedb)
```

## Text Processing
```bash
grep -rn 'pat' dir/     # Recursive, line numbers
grep -i 'pat' f         # Case-insensitive
grep -v 'pat' f         # Invert match
grep -E 'a|b' f         # Extended regex
grep -o '[0-9]+' f      # Only matched text
rg 'pat'                # ripgrep: faster, respects .gitignore

sed 's/old/new/g' f     # Global replace (stdout)
sed -i 's/old/new/g' f  # In-place edit
sed -n '1,10p' f        # Print lines 1-10
sed '/pat/d' f          # Delete matching lines

awk '{print $1}' f      # First column
awk -F: '{print $1}' /etc/passwd   # Custom delimiter
awk '{s+=$1} END{print s}' f       # Sum column
awk '/pat/ {print $2}' f

cut -d: -f1 /etc/passwd # Field 1 by delimiter
tr 'a-z' 'A-Z' < f      # Translate case
sort -n f               # Numeric sort
sort -u f               # Unique
uniq -c f               # Count adjacent duplicates
wc -l f                 # Line count
head -n 20 f            # First 20 lines
tail -n 20 f            # Last 20 lines
tail -f log             # Follow live
```

## Redirection & Pipes
```bash
cmd > out.txt           # Stdout (overwrite)
cmd >> out.txt          # Stdout (append)
cmd 2> err.txt          # Stderr
cmd &> out.txt          # Both stdout+stderr
cmd 2>&1 | tee log.txt  # Both to pipe and file
cmd > /dev/null         # Discard stdout
cmd1 | cmd2             # Pipe stdout to cmd2
cmd < in.txt            # Stdin from file

diff <(cmd1) <(cmd2)    # Compare command outputs
while read l; do ...; done < <(cmd)   # Process substitution
```

## Expansion & Substitution
```bash
$(cmd)                  # Command substitution (preferred)
`cmd`                   # Old-style backticks
$((5 + 3))              # Arithmetic
{1..10}                 # Brace: 1 2 ... 10
{a,b,c}                 # Brace: a b c
file_{1..3}.txt         # file_1.txt file_2.txt file_3.txt

v="Hello World"
${v:-default}           # Default if unset/empty
${v/World/There}        # Replace first
${v//old/new}           # Replace all
${v,,} ${v^^}           # Lowercase / Uppercase
${#v}                   # Length
```

## History
```bash
history                 # Show history
!123                    # Run history entry 123
!!                      # Previous command
^old^new^               # Replace in previous command
# ~/.bashrc: HISTSIZE=10000; HISTFILESIZE=20000; HISTCONTROL=ignoreboth
```

## Job Control
```bash
cmd &                   # Run in background
jobs                    # List jobs
fg %1                   # Foreground job 1
bg %1                   # Resume job 1 in background
Ctrl+Z                  # Suspend foreground
disown %1               # Remove from job table
nohup cmd &             # Survive logout
```

## Networking
```bash
ping -c 4 host          # 4 ICMP packets
curl -I url             # HEAD request
curl -L url             # Follow redirects
curl -O url             # Save with remote name
curl -s url | jq .      # JSON pretty-print
wget -c url             # Resume download
ss -tlnp                # Listening ports + process
nc -zv host port        # Test TCP port
dig +short example.com  # DNS lookup
ssh user@host           # Connect
ssh -p 2222 user@host   # Custom port
scp f user@host:/path   # Copy to remote
rsync -avz src/ host:dest/   # Sync over SSH
rsync --dry-run -avz src/ dest/  # Simulate
```

## Package Management
Use the universal `sys` CLI for package operations (auto-detects the distro):
```bash
sys pkg update && sys pkg upgrade     # refresh + upgrade
sys pkg install <pkg...>              # install one or more packages
sys pkg remove  <pkg...>              # remove (keep config)
sys pkg purge   <pkg...>              # remove + purge config
sys pkg search <query>                # search the repos
sys pkg info <pkg>                    # show package details
sys pkg list-installed                # list installed packages
sys pkg owns <file>                   # which package owns a file
sys pkg files <pkg>                   # files shipped by a package
sys pkg clean                         # clear package caches
```
Native equivalents (`apt`, `dnf`, `pacman`, `flatpak`) remain available but are
distro-specific — prefer `sys pkg` for portable instructions.

## System Information
```bash
uname -a                # Kernel + host info
cat /etc/os-release     # Distribution
uptime                  # Uptime + load average
free -h                 # Memory usage
df -h                   # Disk usage per mount
du -sh *                # Directory sizes
lsblk                   # Block devices
lscpu                   # CPU info
```

## Permissions & Ownership
```bash
chmod 755 f             # rwxr-xr-x
chmod +x script         # Add execute
chmod -R u+rwX dir/     # Recursive; dirs get execute
chown user:group f      # Change owner + group
chown -R user:group dir/
chmod +t dir            # Sticky bit (only owner deletes)
getfacl f               # Show ACLs
setfacl -m u:user:rwx f # Set ACL
```
