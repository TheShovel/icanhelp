# Git Advanced Operations

## Rebase

### Interactive Rebase
```bash
# Rebase last N commits
git rebase -i HEAD~5

# Rebase onto another branch
git rebase -i main

# Commands in editor:
# pick = use commit
# reword = change message
# edit = amend commit
# squash = merge into previous, keep messages
# fixup = merge into previous, discard message
# drop = delete commit
# exec = run shell command
```

### Rebase Workflow
```bash
# Feature branch workflow
git checkout feature
git fetch origin
git rebase origin/main
# Resolve conflicts
git add .
git rebase --continue
git push --force-with-lease

# Update PR branch
git fetch origin
git rebase origin/main
git push --force-with-lease origin feature
```

### Rebase vs Merge
| Aspect | Rebase | Merge |
|--------|--------|-------|
| History | Linear | Preserves branches |
| Conflicts | Resolve per commit | Resolve once |
| Safety | Rewrites history | Non-destructive |
| Use case | Feature branches | Main branch, shared branches |

## Stash

### Basic Stash
```bash
git stash                    # Stash changes
git stash push -m "message"  # Named stash
git stash list               # List stashes
git stash show -p stash@{0}  # Show diff
git stash pop                # Apply and drop
git stash apply stash@{0}    # Apply (keep in stash)
git stash drop stash@{0}     # Delete
git stash clear              # Delete all
```

### Advanced Stash
```bash
# Stash specific files
git stash push -m "partial" -- path/to/file

# Stash untracked files
git stash -u
git stash --include-untracked

# Stash staged only
git stash push --staged

# Create branch from stash
git stash branch new-branch stash@{0}
```

## Bisect (Binary Search for Bugs)

### Automated Bisect
```bash
# Start bisect
git bisect start

# Mark known bad (current)
git bisect bad

# Mark known good (tag/commit)
git bisect good v1.0.0

# Test current commit
# Run tests, then:
git bisect good   # If tests pass
git bisect bad    # If tests fail

# Automate with script
git bisect run ./test.sh
# Script exits 0 = good, 1-127 = bad, 125 = skip

# Reset
git bisect reset
```

### Manual Bisect
```bash
# Visualize
git bisect visualize
gitk --bisect

# Skip untestable commit
git bisect skip

# Log
git bisect log
```

## Reflog (Recovery)

### Recovery Scenarios
```bash
# View reflog
git reflog
git reflog show HEAD
git reflog show --all

# Recover deleted branch
git checkout -b recovered <commit-hash>

# Recover after hard reset
git reset --hard HEAD@{1}

# Recover after rebase gone wrong
git reset --hard ORIG_HEAD

# Recover lost commit
git fsck --lost-found
git show <lost-commit-hash>
```

### Reflog Entries
```
HEAD@{0}: commit: Add feature
HEAD@{1}: rebase: checkout main
HEAD@{2}: rebase: pick Add feature
HEAD@{3}: reset: moving to HEAD~1
HEAD@{4}: checkout: moving from main to feature
```

## Cherry-pick

### Basic
```bash
# Pick single commit
git cherry-pick <commit-hash>

# Pick multiple
git cherry-pick <hash1> <hash2> <hash3>

# Pick range
git cherry-pick <start-hash>^..<end-hash>

# No commit (stage only)
git cherry-pick -n <hash>
```

### Conflict Resolution
```bash
# During cherry-pick conflict
git status
# Fix conflicts
git add .
git cherry-pick --continue

# Abort
git cherry-pick --abort

# Skip
git cherry-pick --skip
```

## Commit Manipulation

### Amend Last Commit
```bash
# Change message
git commit --amend -m "New message"

# Add forgotten files
git add forgotten-file
git commit --amend --no-edit

# Change author
git commit --amend --author="Name <email>" --no-edit

# Change date
GIT_COMMITTER_DATE="2024-01-15 10:00" git commit --amend --no-edit --date="2024-01-15 10:00"
```

### Fixup Commits (Autosquash)
```bash
# Create fixup commit
git commit --fixup=<commit-hash>

# Later, rebase with autosquash
git rebase -i --autosquash HEAD~5
# Fixup commits automatically moved below target
```

### Split Commit
```bash
# During interactive rebase, mark commit as 'edit'
# Then:
git reset HEAD^
git add part1
git commit -m "Part 1"
git add part2
git commit -m "Part 2"
git rebase --continue
```

## Submodules

### Add Submodule
```bash
git submodule add https://github.com/user/repo path/to/submodule
git submodule init
git submodule update

# Clone with submodules
git clone --recurse-submodules https://github.com/user/repo
```

### Update Submodule
```bash
# Update to latest remote
git submodule update --remote --merge

# Or in submodule
cd path/to/submodule
git pull origin main
cd ..
git add path/to/submodule
git commit -m "Update submodule"
```

### Remove Submodule
```bash
git submodule deinit path/to/submodule
git rm path/to/submodule
rm -rf .git/modules/path/to/submodule
```

## Worktrees (Multiple Checkouts)

```bash
# Add worktree
git worktree add ../feature-branch feature-branch

# List
git worktree list

# Remove
git worktree remove ../feature-branch

# Prune stale
git worktree prune
```

## Git Hooks

### Client-side Hooks
```bash
# .git/hooks/pre-commit
#!/bin/sh
# Run linter
npm run lint || exit 1

# .git/hooks/commit-msg
#!/bin/sh
# Validate commit message format
grep -qE "^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+" "$1" || exit 1
```

### Server-side Hooks
```bash
# pre-receive (runs before any refs updated)
# update (runs once per ref)
# post-receive (after all refs updated)

# Example: reject force push to main
# .git/hooks/pre-receive
#!/bin/sh
while read oldrev newrev refname; do
    if [ "$refname" = "refs/heads/main" ] && [ "$oldrev" != "0000000000000000000000000000000000000000" ]; then
        if ! git merge-base --is-ancestor "$oldrev" "$newrev"; then
            echo "Force push to main rejected"
            exit 1
        fi
    fi
done
```

### Prepare-commit-msg (Conventional Commits)
```bash
# .git/hooks/prepare-commit-msg
#!/bin/sh
BRANCH=$(git symbolic-ref --short HEAD)
if [[ $BRANCH =~ ^(feature|fix|hotfix)/([A-Z]+-[0-9]+) ]]; then
    TICKET="${BASH_REMATCH[2]}"
    sed -i "1s/^/$TICKET: /" "$1"
fi
```

## Advanced Config

### Aliases
```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.lg "log --oneline --graph --decorate --all"
git config --global alias.ll "log --pretty=format:'%C(yellow)%h%Creset %C(blue)%an%Creset %C(green)%ar%Creset %s'"
git config --global alias.unstage "reset HEAD --"
git config --global alias.last "log -1 HEAD"
git config --global alias.visual "!gitk"
```

### Conditional Config
```bash
# ~/.gitconfig
[includeIf "gitdir:~/work/"]
    path = ~/.gitconfig-work

[includeIf "gitdir:~/personal/"]
    path = ~/.gitconfig-personal
```

### Git Attributes
```bash
# .gitattributes
# Line endings
* text=auto
*.sh text eol=lf
*.bat text eol=crlf

# Binary files
*.png binary
*.jpg binary
*.pdf binary

# Merge strategy
*.json merge=union
*.lock merge=union

# Diff
*.md diff=markdown
```

### Custom Merge Driver
```bash
# ~/.gitconfig
[merge "ours"]
    name = "Keep ours"
    driver = true

# .gitattributes
config.prod.json merge=ours
```

## Searching History

### Log Search
```bash
# By message
git log --grep="bug fix"
git log --grep="JIRA-" --oneline

# By author
git log --author="John"
git log --author="John" --since="2024-01-01" --until="2024-02-01"

# By file
git log -- path/to/file
git log -p path/to/file  # Show patches

# By content (pickaxe)
git log -S "function_name"  # Added/removed string
git log -G "regex_pattern"  # Regex in diff

# By date
git log --since="2 weeks ago"
git log --until="2024-01-01"
git log --after="2024-01-01" --before="2024-02-01"

# Pretty formats
git log --oneline --graph --decorate --all
git log --pretty=format:"%h %an %ad %s" --date=short
```

### Blame
```bash
git blame file.txt
git blame -L 10,20 file.txt
git blame -w file.txt          # Ignore whitespace
git blame -M file.txt          # Detect moved lines
git blame -C file.txt          # Detect copied lines
```

### Show
```bash
git show HEAD
git show HEAD~3:path/to/file   # File at revision
git show commit:path/to/file > file.txt
```

## Cleaning Up

### Prune
```bash
# Remove unreachable objects
git gc
git gc --aggressive --prune=now

# Prune remote branches
git fetch --prune
git remote prune origin
```

### Clean Untracked
```bash
git clean -n          # Dry run
git clean -f          # Remove files
git clean -fd         # Remove files and directories
git clean -fx         # Include ignored files
```

## Large File Storage (LFS)

```bash
# Install
git lfs install

# Track files
git lfs track "*.psd"
git lfs track "*.zip"
git add .gitattributes

# Push
git push origin main

# Pull
git lfs pull

# Migrate existing repo
git lfs migrate import --include="*.psd" --everything
```

## Signing Commits

```bash
# Generate key
gpg --full-generate-key

# List keys
gpg --list-secret-keys --keyid-format=long

# Configure
git config --global user.signingkey KEY_ID
git config --global commit.gpgsign true
git config --global tag.gpgsign true

# Sign commit
git commit -S -m "Signed commit"

# Verify
git log --show-signature
git verify-commit HEAD
```

## Troubleshooting

### Common Issues
```bash
# "Would be overwritten by merge"
git stash
git pull
git stash pop

# "Refusing to merge unrelated histories"
git pull origin main --allow-unrelated-histories

# "File name too long"
git config --global core.longpaths true

# "Permission denied (publickey)"
ssh -T git@github.com
ssh-add ~/.ssh/id_ed25519

# "Push rejected: non-fast-forward"
git pull --rebase
git push

# "Index corrupt"
rm -f .git/index
git reset

# "Object file empty"
git fsck --full
git prune
git fetch --all
```

### Corrupt Repository Recovery
```bash
# Check integrity
git fsck --full

# Clone fresh and copy .git
git clone --bare /path/to/repo /tmp/recovery.git
cd /tmp/recovery.git
git fsck --full

# Restore from remote
git fetch origin
git reset --hard origin/main
```