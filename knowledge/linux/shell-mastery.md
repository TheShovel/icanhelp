# Linux Shell & Command Line Mastery

## Overview
The shell is your primary interface to Linux. Mastering it dramatically increases productivity for development, system administration, and automation.

## Shell Basics

### Common Shells
| Shell | Description | Config File |
|-------|-------------|-------------|
| **bash** | Default on most Linux | `~/.bashrc`, `~/.bash_profile` |
| **zsh** | Extended bash, better completion | `~/.zshrc` |
| **fish** | User-friendly, syntax highlighting | `~/.config/fish/config.fish` |
| **nu** | Structured data shell (tables) | `~/.config/nushell/config.nu` |

### Essential Keybindings (bash/zsh default - Emacs mode)
| Key | Action |
|-----|--------|
| `Ctrl+A` | Beginning of line |
| `Ctrl+E` | End of line |
| `Ctrl+U` | Cut to beginning |
| `Ctrl+K` | Cut to end |
| `Ctrl+W` | Cut word backward |
| `Ctrl+Y` | Paste (yank) |
| `Ctrl+L` | Clear screen |
| `Ctrl+R` | Reverse history search |
| `Ctrl+S` | Forward history search (disable XON: `stty -ixon`) |
| `Ctrl+C` | Interrupt (SIGINT) |
| `Ctrl+Z` | Suspend (SIGTSTP) |
| `Ctrl+D` | EOF (exit shell) |
| `Alt+B` | Back word |
| `Alt+F` | Forward word |
| `Alt+.` | Last argument of previous command |
| `!!` | Previous command |
| `!$` | Last argument of previous command |
| `!*` | All arguments of previous command |

### Vi Mode (set -o vi)
```bash
# Enter vi mode
set -o vi

# Modes:
# ESC → Normal mode (navigate with h/j/k/l, w/b/e)
# i/a → Insert mode
# : → Command mode (history search, etc.)
```

## Navigation & Directory Operations

### Path Shortcuts
| Shortcut | Expands To |
|----------|------------|
| `~` | `$HOME` |
| `~-` | Previous directory (`$OLDPWD`) |
| `~user` | User's home directory |
| `.` | Current directory |
| `..` | Parent directory |
| `-` | Previous directory (cd -) |

### Directory Stack (pushd/popd)
```bash
pushd /path/to/dir   # Push current, change to dir
popd                 # Pop and change to previous
dirs -v              # Show stack with numbers
cd +3                # Change to stack entry 3
```

### cd Tricks
```bash
cd                  # Go home
cd -                # Previous directory
cd ~user            # User's home
cd ../..            # Up two levels
cd /path/{sub1,sub2} # Brace expansion (zsh/fish)
```

## File Operations

### Listing (ls)
```bash
ls -la              # All, long format
ls -lh              # Human-readable sizes
ls -lt              # Sort by time (newest first)
ls -lS              # Sort by size (largest first)
ls -ltr             # Reverse time (oldest first)
ls -d */            # Only directories
ls --color=auto     # Color output
```

### Modern Replacements
| Command | Replacement | Benefits |
|---------|-------------|----------|
| `ls` | `eza` / `exa` | Colors, git status, tree view |
| `cat` | `bat` | Syntax highlighting, paging |
| `find` | `fd` | Faster, colored, ignores .git |
| `grep` | `rg` (ripgrep) | Faster, respects .gitignore |
| `du` | `dust` | Visual tree |
| `top/htop` | `btop` / `btm` | Better UI |
| `ps` | `procs` | Modern output |
| `curl` | `httpie` / `xh` | Better syntax |

### File Manipulation
```bash
# Copy with progress
cp -r src/ dest/
rsync -av --progress src/ dest/

# Move/rename
mv file.txt newname.txt
mv file.txt /path/to/dir/

# Remove safely
rm -i file.txt          # Interactive
rm -rf dir/             # Recursive force (DANGEROUS)
trash file.txt          # Use trash-cli (safer)

# Create directories
mkdir -p path/to/dir    # Parents, no error if exists

# Links
ln -s target link       # Symbolic (soft)
ln target link          # Hard link
```

### Finding Files
```bash
# fd (modern find)
fd pattern              # Case-insensitive by default
fd -e py pattern        # Only .py files
fd -H pattern           # Include hidden
fd -t f pattern         # Only files
fd -t d pattern         # Only directories
fd -x command {}        # Execute on each

# find (traditional)
find . -name "*.py" -type f
find . -size +100M      # Files > 100MB
find . -mtime -7        # Modified last 7 days
find . -exec rm {} +    # Delete found

# locate (database, fast)
locate pattern          # Updated daily via cron
```

## Text Processing

### grep / ripgrep (rg)
```bash
# Basic
grep "pattern" file
grep -r "pattern" dir/      # Recursive
grep -i "pattern" file      # Case-insensitive
grep -v "pattern" file      # Invert match
grep -n "pattern" file      # Line numbers
grep -A 3 -B 3 "pattern"    # Context (after/before)
grep -E "pat1|pat2" file    # Extended regex
grep -P "pattern" file      # Perl regex

# ripgrep (faster, respects .gitignore)
rg "pattern"
rg -t py "pattern"          # Only .py files
rg --files-with-matches     # Just filenames
rg --replace "new" "old"    # Preview replacement
```

### sed (Stream Editor)
```bash
sed 's/old/new/' file       # First occurrence per line
sed 's/old/new/g' file      # Global (all occurrences)
sed -i 's/old/new/g' file   # In-place edit
sed '2,5d' file             # Delete lines 2-5
sed '/pattern/d' file       # Delete matching lines
sed -n '1,10p' file         # Print lines 1-10
sed 's/^/PREFIX/' file      # Add prefix to each line
```

### awk (Column Processing)
```bash
awk '{print $1}' file       # First column
awk -F: '{print $1}' /etc/passwd  # Custom delimiter
awk '$3 > 100' file         # Filter rows
awk '{sum+=$1} END {print sum}' file  # Sum column
awk '{print NR ": " $0}' file  # Add line numbers
```

### cut / tr / sort / uniq
```bash
cut -d: -f1 /etc/passwd     # Cut by delimiter, field 1
cut -c1-10 file             # Characters 1-10

tr 'a-z' 'A-Z'              # Translate case
tr -d '\r' < file           # Delete carriage returns
tr '\n' ' ' < file          # Newlines to spaces

sort file                   # Sort lines
sort -n file                # Numeric sort
sort -r file                # Reverse
sort -u file                # Unique

uniq file                   # Adjacent duplicates
uniq -c file                # Count occurrences
sort file | uniq -c | sort -rn  # Frequency count
```

## Redirection & Pipes

### Redirection Operators
| Operator | Description |
|----------|-------------|
| `>` | Redirect stdout (overwrite) |
| `>>` | Redirect stdout (append) |
| `<` | Redirect stdin |
| `2>` | Redirect stderr |
| `2>&1` | Redirect stderr to stdout |
| `&>` | Redirect both stdout and stderr |
| `>&` | Same as `&>` (bash) |
| `<>` | Read/write file descriptor |

### Examples
```bash
command > output.txt           # Stdout to file
command 2> error.txt           # Stderr to file
command > out.txt 2>&1         # Both to file (old syntax)
command &> out.txt             # Both to file (bash)
command 2>&1 | tee log.txt     # Both to pipe and file
command > /dev/null            # Discard stdout
command 2> /dev/null           # Discard stderr
command &> /dev/null           # Discard both

# Here documents
cat << EOF > file.txt
Line 1
Line 2
$VARIABLE expands
EOF

cat << 'EOF' > file.txt
Literal $VARIABLE
EOF
```

### Process Substitution
```bash
# Compare output of two commands
diff <(cmd1) <(cmd2)

# Use command output as file
while read line; do ...; done < <(command)

# Multiple inputs to command
paste <(cmd1) <(cmd2)
```

## Command Substitution & Expansion

### Substitution
```bash
$(command)          # Preferred (nestable)
`command`           # Old style (backticks)

# Examples
files=$(ls *.txt)
echo "Today is $(date)"
result=$((5 + 3))   # Arithmetic
```

### Brace Expansion
```bash
echo {a,b,c}           # a b c
echo {1..10}           # 1 2 3 ... 10
echo {01..10}          # 01 02 ... 10
echo {a..z}            # a b c ... z
echo file_{1..3}.txt   # file_1.txt file_2.txt file_3.txt
mkdir -p project/{src,test,doc}/{main,util}
```

### Parameter Expansion
```bash
var="hello world"

${var}                # Value
${var:-default}       # Default if unset/empty
${var:=default}       # Assign default if unset/empty
${var:+alternate}     # Alternate if set
${var:?error}         # Error if unset/empty
${#var}               # Length
${var^^}              # Uppercase (bash 4+)
${var,,}              # Lowercase (bash 4+)
${var/old/new}        # Replace first
${var//old/new}       # Replace all
${var/#prefix/new}    # Replace prefix
${var/%suffix/new}    # Replace suffix
${var:offset:length}  # Substring
```

## History Management

### History Commands
```bash
history               # Show history
history 20            # Last 20 commands
!123                  # Execute history #123
!!                    # Previous command
!$                    # Last argument of previous
!*                    # All arguments of previous
^old^new^             # Replace in previous command
```

### History Configuration
```bash
# In ~/.bashrc or ~/.zshrc
HISTSIZE=10000              # Memory history
HISTFILESIZE=20000          # File history
HISTCONTROL=ignoreboth      # Ignore duplicates & space-prefixed
HISTIGNORE="ls:cd:pwd:exit" # Don't record these
shopt -s histappend         # Append, don't overwrite
PROMPT_COMMAND="history -a" # Save after each command
```

### History Search
```bash
# Ctrl+R - Reverse incremental search (type to filter)
# Ctrl+S - Forward search (enable: stty -ixon)
# Alt+.  - Insert last argument
# Alt+Ctrl+Y - Insert arguments from previous command
```

## Process Management

### Job Control
```bash
command &           # Run in background
jobs                # List jobs
fg %1               # Foreground job 1
bg %1               # Background job 1
Ctrl+Z              # Suspend foreground
disown %1           # Remove from job table
nohup command &     # Immune to hangup
```

### Process Inspection
```bash
ps aux              # All processes
ps aux | grep name  # Find by name
pgrep name          # PIDs by name
pkill name          # Kill by name
pstree              # Process tree
htop / btop         # Interactive
```

### Signals
```bash
kill PID            # SIGTERM (15) - graceful
kill -9 PID         # SIGKILL (9) - force
kill -HUP PID       # SIGHUP (1) - reload config
kill -STOP PID      # Pause
kill -CONT PID      # Resume
killall name        # Kill all by name
```

## Networking Commands

### Connectivity
```bash
ping host           # ICMP ping
ping -c 4 host      # 4 packets
traceroute host     # Trace route
mtr host            # Continuous traceroute
nc -zv host port    # Test TCP port
telnet host port    # Connect to port
```

### DNS
```bash
dig example.com           # Full DNS query
dig +short example.com    # Just IP
dig @8.8.8.8 example.com  # Specific server
dig MX example.com        # Mail records
dig -x 1.2.3.4            # Reverse lookup
nslookup example.com      # Alternative
host example.com          # Simple lookup
```

### HTTP
```bash
curl -I url                  # HEAD only
curl -v url                  # Verbose
curl -L url                  # Follow redirects
curl -o file url             # Save to file
curl -O url                  # Save with remote name
curl -H "Header: value" url  # Custom header
curl -X POST -d "data" url   # POST
curl -u user:pass url        # Basic auth
curl -s url | jq .           # JSON pretty print

# httpie (friendlier)
http GET url
http POST url name=value
http --json GET url
```

### SSH
```bash
ssh user@host
ssh -p 2222 user@host       # Custom port
ssh -i key.pem user@host    # Identity file
ssh -L 8080:localhost:80    # Local port forward
ssh -R 8080:localhost:80    # Remote port forward
ssh -D 1080 user@host       # SOCKS proxy
scp file user@host:/path    # Copy to remote
scp user@host:/path file    # Copy from remote
rsync -avz src/ host:dest/  # Sync with compression
```

## Package Management

### apt (Debian/Ubuntu)
```bash
apt update                  # Update package list
apt upgrade                 # Upgrade packages
apt install pkg             # Install
apt remove pkg              # Remove
apt purge pkg               # Remove + config
apt search term             # Search
apt show pkg                # Package info
apt list --installed        # List installed
apt autoremove              # Remove unused deps
apt full-upgrade            # Smart upgrade
```

### dnf/yum (Fedora/RHEL)
```bash
dnf install pkg
dnf remove pkg
dnf search term
dnf info pkg
dnf list installed
dnf upgrade
dnf autoremove
```

### pacman (Arch)
```bash
pacman -S pkg               # Install
pacman -R pkg               # Remove
pacman -Rs pkg              # Remove + deps
pacman -Ss term             # Search
pacman -Si pkg              # Info
pacman -Q                   # List installed
pacman -Syu                 # Full upgrade
```

### snap / flatpak
```bash
snap install pkg
snap list
snap remove pkg

flatpak install flathub pkg
flatpak list
flatpak uninstall pkg
```

## Archives & Compression

### tar
```bash
tar -czf archive.tar.gz dir/     # Create gzip
tar -xzf archive.tar.gz          # Extract gzip
tar -cjf archive.tar.bz2 dir/    # Create bzip2
tar -xjf archive.tar.bz2         # Extract bzip2
tar -cJf archive.tar.xz dir/     # Create xz
tar -xJf archive.tar.xz          # Extract xz
tar -tvf archive.tar.gz          # List contents
tar -xzf archive.tar.gz -C /path # Extract to path
```

### zip/unzip
```bash
zip -r archive.zip dir/
unzip archive.zip
unzip -l archive.zip    # List
```

### Modern
```bash
# zstd (fast, good compression)
tar -czf archive.tar.zst dir/
tar -xzf archive.tar.zst

# 7z (best compression)
7z a archive.7z dir/
7z x archive.7z
```

## System Information

### Hardware
```bash
lscpu                   # CPU info
lsmem                   # Memory
lsblk                   # Block devices
lsblk -f                # With filesystems
df -h                   # Disk usage
du -sh *                # Dir sizes
free -h                 # Memory usage
lspci                   # PCI devices
lsusb                   # USB devices
dmidecode               # DMI/SMBIOS (sudo)
```

### Kernel & OS
```bash
uname -a                # All kernel info
uname -r                # Kernel release
cat /etc/os-release     # Distribution info
hostnamectl             # System hostname info
uptime                  # Uptime + load
who -b                  # Last boot
```

## Permissions & Ownership

### chmod
```bash
chmod 755 file          # rwxr-xr-x
chmod 644 file          # rw-r--r--
chmod +x script         # Add execute
chmod -R u+rwX dir/     # Recursive, dirs get X
chmod u=rwx,g=rx,o=rx file  # Symbolic
```

### chown/chgrp
```bash
chown user:group file
chown -R user:group dir/
chgrp group file
```

### Special Bits
```bash
chmod +s file           # SUID/SGID
chmod +t dir            # Sticky bit (only owner can delete)
```

### ACLs
```bash
getfacl file
setfacl -m u:user:rwx file
setfacl -m g:group:rx file
setfacl -x u:user file  # Remove ACL
```

## Environment & Variables

### Common Variables
```bash
$HOME                   # Home directory
$USER                   # Username
$PWD                    # Current directory
$OLDPWD                 # Previous directory
$PATH                   # Command search path
$SHELL                  # Current shell
$LANG / $LC_ALL         # Locale
$EDITOR / $VISUAL       # Default editor
$PAGER                  # Default pager (less)
$TERM                   # Terminal type
$DISPLAY                # X display
$SSH_CONNECTION         # SSH client info
```

### Setting Variables
```bash
export VAR=value        # Export to children
VAR=value command       # Temporary for command
export PATH="$PATH:/new/path"
readonly VAR            # Make readonly
unset VAR               # Remove
```

## Scripting Basics

### Shebang
```bash
#!/usr/bin/env bash
#!/usr/bin/env python3
```

### Variables & Quoting
```bash
# Always quote variables
"$var"          # Preserves whitespace, prevents globbing
$var            # Splits on IFS, expands globs

# Arrays (bash)
arr=(one two three)
echo ${arr[0]}      # one
echo ${arr[@]}      # all elements
echo ${#arr[@]}     # length
arr+=(four)         # append

# Associative arrays (bash 4+)
declare -A map
map[key]=value
echo ${map[key]}
```

### Conditionals
```bash
# Test commands
[ condition ]       # POSIX test
[[ condition ]]     # Bash extended (preferred)
(( arithmetic ))    # Arithmetic evaluation

# File tests
[[ -f file ]]       # Regular file
[[ -d dir ]]        # Directory
[[ -e path ]]       # Exists
[[ -r file ]]       # Readable
[[ -w file ]]       # Writable
[[ -x file ]]       # Executable
[[ -L link ]]       # Symlink
[[ file1 -nt file2 ]] # Newer than
[[ file1 -ot file2 ]] # Older than

# String tests
[[ -z str ]]        # Empty
[[ -n str ]]        # Non-empty
[[ str1 = str2 ]]   # Equal
[[ str1 != str2 ]]  # Not equal
[[ str =~ regex ]]  # Regex match

# Arithmetic
(( a < b ))
(( a > 10 ))
```

### Control Flow
```bash
if [[ condition ]]; then
    ...
elif [[ condition ]]; then
    ...
else
    ...
fi

for var in list; do
    ...
done

for ((i=0; i<10; i++)); do
    ...
done

while [[ condition ]]; do
    ...
done

case $var in
    pattern1) ... ;;
    pattern2) ... ;;
    *) ... ;;
esac
```

### Functions
```bash
my_func() {
    local arg1=$1
    local arg2=${2:-default}
    echo "Args: $arg1, $arg2"
    return 0
}

# Call
my_func "hello" "world"
result=$?
```

### Error Handling
```bash
set -euo pipefail
# -e: Exit on error
# -u: Error on unset variable
# -o pipefail: Pipeline fails if any command fails

trap 'cleanup' EXIT     # Run on exit
trap 'cleanup' ERR      # Run on error
trap 'cleanup' INT TERM # Run on signals
```

## Useful One-Liners

### File Operations
```bash
# Find large files
find . -type f -size +100M -exec ls -lh {} \;

# Delete old files
find /tmp -type f -mtime +7 -delete

# Rename spaces to underscores
for f in *\ *; do mv "$f" "${f// /_}"; done

# Batch rename extension
for f in *.jpeg; do mv "$f" "${f%.jpeg}.jpg"; done
```

### Text Processing
```bash
# Extract IPs from log
grep -oE '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' access.log | sort -u

# Count lines in all .py files
wc -l **/*.py

# Most common words
tr ' ' '\n' < file | sort | uniq -c | sort -rn | head -20

# Remove duplicate lines (preserve order)
awk '!seen[$0]++' file
```

### System
```bash
# Kill process on port
kill $(lsof -ti:8080)

# Show open ports
ss -tlnp

# Disk usage by folder
du -h --max-depth=1 | sort -hr

# Follow logs
tail -f /var/log/syslog | grep -i error

# Monitor command
watch -n 1 'df -h'
```

## Customization

### Aliases
```bash
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias grep='grep --color=auto'
alias df='df -h'
alias du='du -h'
alias free='free -h'
alias ps='ps auxf'
alias ports='ss -tlnp'
alias myip='curl -s ifconfig.me'
alias weather='curl wttr.in'
```

### Prompt (PS1)
```bash
# Simple with git
PS1='\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]$(__git_ps1 " (%s)")\$ '

# Minimal
PS1='\w \$ '

# Powerline-style (needs fonts)
PS1='\[\033[38;5;39m\]\u@\h \[\033[38;5;208m\]\w \[\033[0m\]\$ '
```

### Useful Functions
```bash
# Create and cd
mkcd() { mkdir -p "$1" && cd "$1"; }

# Extract any archive
extract() {
    if [[ -f $1 ]]; then
        case $1 in
            *.tar.bz2) tar xjf "$1" ;;
            *.tar.gz)  tar xzf "$1" ;;
            *.tar.xz)  tar xJf "$1" ;;
            *.bz2)     bunzip2 "$1" ;;
            *.rar)     unrar x "$1" ;;
            *.gz)      gunzip "$1" ;;
            *.tar)     tar xf "$1" ;;
            *.tbz2)    tar xjf "$1" ;;
            *.tgz)     tar xzf "$1" ;;
            *.zip)     unzip "$1" ;;
            *.Z)       uncompress "$1" ;;
            *.7z)      7z x "$1" ;;
            *)         echo "Unknown: $1" ;;
        esac
    else
        echo "Not a file: $1"
    fi
}

# Quick web server
serve() { python3 -m http.server ${1:-8000}; }

# Weather
wttr() { curl "wttr.in/${1:-}"; }

# Cheat sheet
cheat() { curl "cheat.sh/${1:-}"; }
```

## Resources
- **man pages**: `man bash`, `man zsh`, `man find`, `man grep`
- **TL;DR pages**: `tldr command` (community cheat sheets)
- **Cheat.sh**: `curl cheat.sh/command`
- **Explainshell**: explainshell.com (parses commands)
- **ShellCheck**: shellcheck.net (static analysis)
- **Awesome Bash**: github.com/awesome-lists/awesome-bash