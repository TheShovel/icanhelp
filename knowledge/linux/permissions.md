# File Permissions & Ownership

`chmod`/`chown`/`setfacl` are universal — use them directly (not wrapped by `sys`).

## Mode format
`-rwxr-xr--` → type, owner(u), group(g), others(o).
`r`=4 read, `w`=2 write, `x`=1 execute.

Common modes: `755` (exec/dir), `644` (file), `600` (private), `700` (private dir), `777` (avoid), `400` (read-only).

## Change permissions
```bash
chmod 755 script.sh
chmod u+x script.sh
chmod g-w file
chmod -R 755 dir/
chmod u=rw,g=r,o=r file
chmod +t /tmp            # sticky bit (only owner deletes)
chmod g+s dir/           # setgid (new files inherit group)
chmod u+s file           # setuid (run as owner)
```

## Ownership
```bash
chown user file
chown user:group file
chown :group file
chown -R user:group dir/
chgrp group file
```

## Special bits
- **setuid (4000)** `chmod u+s` — runs with file owner's privileges (e.g. `/usr/bin/passwd`)
- **setgid (2000)** `chmod g+s dir` — new files inherit directory group
- **sticky (1000)** `chmod +t dir` — only file owners can delete (e.g. `/tmp`)

```bash
find / -perm -4000        # setuid files
find / -perm -2000        # setgid files
find / -perm -1000        # sticky dirs
```

## umask
```bash
umask                     # show (e.g. 022)
umask 077                 # restrictive
```
Subtracted from 666 (files) / 777 (dirs): `022`→644/755, `077`→600/700, `002`→664/775.

## ACLs
```bash
getfacl file
setfacl -m u:user:rwx file
setfacl -m g:group:rx file
setfacl -x u:user file
setfacl -b file
setfacl -R -m u:user:rx dir/
setfacl -d -m g:group:rwx dir/   # default ACL for new files
```
