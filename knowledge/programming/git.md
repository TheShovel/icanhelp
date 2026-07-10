# Git & Version Control

## Configuration
```
git config --global user.name "Name"
git config --global user.email "email"
git config --global core.editor "vim"
git config --global init.defaultBranch main
git config --global core.autocrlf input     # Linux
git config --global pull.rebase true        # rebase on pull
git config --list                           # see all config
git config --global alias.co checkout       # create alias
```

## Creating & Cloning
```
git init                      — create new repo
git clone <url>               — clone remote
git clone --depth=1 <url>     — shallow clone (no history)
git clone --recurse-submodules <url> — clone with submodules
```

## Basic Workflow
```
git status                    — show changes
git add <file>                — stage file
git add .                     — stage all
git add -p                    — stage hunks interactively
git commit -m "message"       — commit staged
git commit -am "msg"          — stage+commit tracked files
git rm <file>                 — remove + stage
git mv <old> <new>            — move + stage
git restore <file>            — discard unstaged changes
git restore --staged <file>   — unstage
git checkout -- <file>        — discard (legacy, same as restore)
git clean -fd                 — remove untracked files/dirs
```

## Branching
```
git branch                    — list branches
git branch <name>             — create branch
git branch -d <name>          — delete branch (merged)
git branch -D <name>          — force delete
git branch -m <old> <new>     — rename branch
git checkout -b <name>        — create + switch
git switch -c <name>          — create + switch (new way)
git switch <name>             — switch branch
git switch -                  — switch to previous branch
```

## Merging & Rebasing
```
git merge <branch>            — merge branch into current
git merge --abort             — abort merge
git rebase <branch>           — rebase current onto branch
git rebase -i HEAD~5          — interactive rebase last 5 commits
git rebase --abort            — abort rebase
git rebase --continue         — continue after conflict resolved
git cherry-pick <commit>      — apply specific commit
```

## Remote
```
git remote -v                 — list remotes
git remote add origin <url>   — add remote
git remote remove <name>      — remove remote
git fetch origin              — fetch but don't merge
git pull                      — fetch + merge (or rebase)
git pull --rebase             — fetch + rebase
git push origin main          — push branch
git push -u origin main       — push + set upstream
git push --force              — force push (dangerous)
git push --force-with-lease   — safer force push
git push origin --delete <branch> — delete remote branch
```

## Viewing History
```
git log                       — full history
git log --oneline             — compact history
git log --graph               — graph view
git log --oneline --graph --all
git log -p                    — with diffs
git log --stat                — with file stats
git log --follow <file>       — file history (incl. renames)
git show <commit>             — show commit diff
git diff                      — unstaged changes
git diff --staged             — staged changes
git diff <branch1> <branch2>  — compare branches
git diff HEAD~2 HEAD          — compare 2 commits ago to now
git blame <file>              — show who changed each line
git shortlog                  — commits by author
```

## Stashing
```
git stash                     — save changes
git stash list                — list stashes
git stash pop                 — apply + drop
git stash apply               — apply (keep stash)
git stash drop                — drop stash
git stash -u                  — stash untracked files
git stash branch <name>       — new branch from stash
```

## Undoing
```
git commit --amend            — amend last commit (edit message/files)
git reset HEAD~1              — undo commit, keep changes staged
git reset --soft HEAD~1       — undo commit, keep changes staged
git reset --mixed HEAD~1      — undo commit, keep changes working (default)
git reset --hard HEAD~1       — undo commit, discard changes (dangerous)
git revert <commit>           — create new commit that undoes old one
git reflog                    — reference log (recovery tool)
```

## Tags
```
git tag                       — list tags
git tag v1.0.0                — create lightweight tag
git tag -a v1.0.0 -m "msg"   — annotated tag
git push origin v1.0.0        — push tag
git push origin --tags        — push all tags
git tag -d v1.0.0             — delete local tag
git push origin --delete v1.0.0 — delete remote tag
```

## .gitignore
Common patterns:
```
node_modules/
dist/
*.log
.env*
.vscode/
__pycache__/
*.pyc
.DS_Store
*.o
*.swp
```

## Submodules
```
git submodule add <url> path    — add submodule
git submodule update --init     — init + update
git submodule update --remote   — update to latest
git clone --recurse-submodules <url> — clone with submodules
```

## Advanced
```
git bisect start                — binary search for bug
git bisect bad                  — mark current as bad
git bisect good <commit>        — mark good commit
git bisect reset                — end bisect
git log --grep="pattern"        — search commit messages
git log -S "string"             — search code changes (pickaxe)
git shortlog -sn                — contributor stats
git verify-pack -v .git/objects/pack/*.idx | sort -k3 -n | tail -30  — largest objects
```

## Workflow Examples
```bash
# Feature branch workflow
git checkout -b feature/new-thing
git add .
git commit -m "Add new thing"
git checkout main
git pull --rebase
git checkout feature/new-thing
git rebase main
git checkout main
git merge feature/new-thing
git push origin main

# Fix last commit
git commit --amend -m "correct message"
git add forgotten-file
git commit --amend --no-edit

# Undo pushed commit (careful)
git revert HEAD
git push origin main
```
