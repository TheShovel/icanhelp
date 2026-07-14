# TL;DR Command Cheat Sheets

Concise examples for common commands. Replace `{{...}}` placeholders with real
values. For deeper explanation see `shell-mastery.md`, `bash.md`, and
`compression-tools.md`.

# find

> Find files or directories under a directory tree, recursively.
> See also: `fd`.

- Find files by extension:

`find {{path/to/directory}} -name '{{*.ext}}'`

- Find files matching multiple patterns:

`find {{path/to/directory}} -path '{{*/path/*/*.ext}}' -or -name '{{*pattern*}}'`

- Find directories by name, case-insensitive:

`find {{path/to/directory}} -type d -iname '{{*lib*}}'`

- Find files excluding specific paths:

`find {{path/to/directory}} -name '{{*.py}}' -not -path '{{*/site-packages/*}}'`

- Find files in a size range, depth 1:

`find {{path/to/directory}} -maxdepth 1 -size {{+500k}} -size {{-10M}}`

- Run a command per file:

`find {{path/to/directory}} -name '{{*.ext}}' -exec {{wc -l}} {} \;`

- Archive files modified today:

`find {{path/to/directory}} -daystart -mtime {{-1}} -exec {{tar -cvf archive.tar}} {} \+`

- Delete empty files/dirs verbosely:

`find {{path/to/directory}} -type {{f|d}} -empty -delete -print`

---

# grep

> Find patterns in files using regexes. See also: `rg`.

- Search for a pattern in files:

`grep "{{search_pattern}}" {{path/to/file1 path/to/file2 ...}}`

- Search for an exact string:

`grep {{[-F|--fixed-strings]}} "{{exact_string}}" {{path/to/file}}`

- Recursive search, ignore binary files:

`grep {{[-rI|--recursive --binary-files=without-match]}} "{{search_pattern}}" {{path/to/directory}}`

- Print 3 lines of context around each match:

`grep {{--context|--before-context|--after-context}} 3 "{{search_pattern}}" {{path/to/file}}`

- File name + line number, colored:

`grep {{[-Hn|--with-filename --line-number]}} --color=always "{{search_pattern}}" {{path/to/file}}`

- Print only the matched text:

`grep {{[-o|--only-matching]}} "{{search_pattern}}" {{path/to/file}}`

- Invert match from stdin:

`cat {{path/to/file}} | grep {{[-v|--invert-match]}} "{{search_pattern}}"`

- Extended regex, case-insensitive:

`grep {{[-Ei|--extended-regexp --ignore-case]}} "{{search_pattern}}" {{path/to/file}}`

---

# sed

> Edit text in a scriptable manner. See also: `awk`, `ed`.

- Replace all `apple` with `mango` and print to stdout:

`{{command}} | sed 's/apple/mango/g'`

- Run a script file:

`{{command}} | sed -f {{path/to/script.sed}}`

- Print just the first line:

`{{command}} | sed -n '1p'`

---

# awk

> A versatile programming language for working on files. See also: `gawk`.

- Print the fifth column in a space-separated file:

`awk '{print $5}' {{path/to/file}}`

- Print the second column of lines containing "foo":

`awk '/{{foo}}/ {print $2}' {{path/to/file}}`

- Print the last column, comma-separated:

`awk -F ',' '{print $NF}' {{path/to/file}}`

- Sum the first column:

`awk '{s+=$1} END {print s}' {{path/to/file}}`

- Print every third line from the first:

`awk 'NR%3==1' {{path/to/file}}`

- Conditional output:

`awk '{if ($1 == "foo") print "Exact match foo"; else if ($1 ~ "bar") print "Partial match bar"; else print "Baz"}' {{path/to/file}}`

- Rows where column 10 is in a range:

`awk '($10 >= {{min_value}} && $10 <= {{max_value}})' {{path/to/file}}`

- Table of users with UID >= 1000:

`awk 'BEGIN {FS=":";printf "%-20s %6s %25s\n", "Name", "UID", "Shell"} $4 >= 1000 {printf "%-20s %6d %25s\n", $1, $4, $7}' /etc/passwd`

---

# tar

> Archiving utility, often combined with gzip/bzip2/xz.

- Create an archive:

`tar cf {{path/to/target.tar}} {{path/to/file1 path/to/file2 ...}}`

- Create a gzipped archive:

`tar czf {{path/to/target.tar.gz}} {{path/to/file1 path/to/file2 ...}}`

- Create from a directory using relative paths:

`tar czf {{path/to/target.tar.gz}} {{[-C|--directory]}} {{path/to/directory}} .`

- Extract verbosely into current directory:

`tar xvf {{path/to/source.tar[.gz|.bz2|.xz]}}`

- Extract into a target directory:

`tar xf {{path/to/source.tar[.gz|.bz2|.xz]}} {{[-C|--directory]}} {{path/to/directory}}`

- Auto-detect compression by extension:

`tar caf {{path/to/target.tar.xz}} {{path/to/file1 path/to/file2 ...}}`

- List contents verbosely:

`tar tvf {{path/to/source.tar}}`

- Extract files matching a pattern:

`tar xf {{path/to/source.tar}} --wildcards "{{*.html}}"`

---

# rsync

> Transfer files to/from a remote host over SSH. Use `--dry-run` to simulate.

- Transfer a file:

`rsync {{path/to/source}} {{path/to/destination}}`

- Archive mode (recursive, preserves perms/times/symlinks):

`rsync {{[-a|--archive]}} {{path/to/source}} {{path/to/destination}}`

- Compress, verbose, partial, progress:

`rsync {{[-zvhP|--compress --verbose --human-readable --partial --progress]}} {{path/to/source}} {{path/to/destination}}`

- Copy directory contents (not the dir itself):

`rsync {{[-r|--recursive]}} {{path/to/source}}/ {{path/to/destination}}`

- Over SSH on a custom port with progress:

`rsync {{[-e|--rsh]}} 'ssh -p {{port}}' --info=progress2 {{host}}:{{path/to/source}} {{path/to/destination}}`

---

# ssh

> Secure Shell for logging into and running commands on remote systems.

- Connect to a remote server:

`ssh {{username}}@{{remote_host}}`

- Connect with a specific identity (private key):

`ssh {{username}}@{{remote_host}} -i {{path/to/key_file}}`

- Connect on a specific port:

`ssh {{username}}@{{remote_host}} -p {{2222}}`

- Run a command with a tty:

`ssh {{username}}@{{remote_host}} -t {{command}} {{command_arguments}}`

- Dynamic port forwarding (SOCKS proxy on localhost:1080):

`ssh {{username}}@{{remote_host}} -D {{1080}}`

- Local port forward (localhost:9999 -> example.org:80):

`ssh {{username}}@{{remote_host}} -L {{9999}}:{{example.org}}:{{80}} -N -T`

- Jump through a jumphost:

`ssh {{username}}@{{remote_host}} -J {{username}}@{{jump_host}}`

- Close a hung session: `<Enter><~><.>`

---

# scp

> Secure copy between hosts over SSH.

- Copy a local file to a remote host:

`scp {{path/to/local_file}} {{remote_host}}:{{path/to/remote_file}}`

- Use a specific port:

`scp -P {{port}} {{path/to/local_file}} {{remote_host}}:{{path/to/remote_file}}`

- Copy from a remote host to a local directory:

`scp {{remote_host}}:{{path/to/remote_file}} {{path/to/local_directory}}`

- Recursively copy a remote directory:

`scp -r {{remote_host}}:{{path/to/remote_directory}} {{path/to/local_directory}}`

- Copy between two remote hosts via local:

`scp -3 {{host1}}:{{path/to/remote_file}} {{host2}}:{{path/to/remote_directory}}`

- Use a specific key / proxy:

`scp -i {{~/.ssh/private_key}} {{path/to/local_file}} {{remote_host}}:{{path/to/remote_file}}`

`scp -J {{proxy_username}}@{{proxy_host}} {{path/to/local_file}} {{remote_host}}:{{path/to/remote_file}}`

---

# curl

> Transfer data to/from a server (HTTP, HTTPS, FTP, etc.). See also: `wget`.

- GET and print to stdout:

`curl {{https://example.com}}`

- GET, follow redirects, dump headers + body:

`curl {{[-L|--location]}} {{[-D|--dump-header]}} - {{https://example.com}}`

- Download, saving with the URL's filename:

`curl {{[-O|--remote-name]}} {{https://example.com/filename.zip}}`

- POST form-encoded data:

`curl {{[-X|--request]}} POST {{[-d|--data]}} '{{name=bob}}' {{http://example.com/form}}`

- POST JSON with header:

`curl {{[-d|--data]}} '{{{"name":"bob"}}}' {{[-H|--header]}} '{{Content-Type: application/json}}' {{http://example.com/users/1234}}`

- Through a proxy, ignore self-signed certs:

`curl {{[-k|--insecure]}} {{[-x|--proxy]}} {{http://127.0.0.1:8080}} {{[-H|--header]}} '{{Authorization: Bearer token}}' {{[-X|--request]}} {{GET|PUT|POST|DELETE|PATCH|...}} {{https://example.com}}`

---

# wget

> Download files from the Web (HTTP, HTTPS, FTP). See also: `curl`.

- Download a URL to a file:

`wget {{https://example.com/foo}}`

- Download to a named file:

`wget {{[-O|--output-document]}} {{bar}} {{https://example.com/foo}}`

- Mirror a site (3s interval):

`wget {{[-pkw|--page-requisites --convert-links --wait]}} 3 {{https://example.com/some_page.html}}`

- Mirror a directory, no parent:

`wget {{[-mnp|--mirror --no-parent]}} {{https://example.com/some_path/}}`

- Limit speed and retries:

`wget --limit-rate {{300k}} {{[-t|--tries]}} {{100}} {{https://example.com/some_path/}}`

- Continue an incomplete download:

`wget {{[-c|--continue]}} {{https://example.com}}`

- Download URLs listed in a file:

`wget {{[-P|--directory-prefix]}} {{path/to/directory}} {{[-i|--input-file]}} {{path/to/URLs.txt}}`

---

# crontab

> Schedule cron jobs for the current user. Requires the `cron` daemon (unit name
> varies by distro: `cronie` on Arch, `cron` on Debian/Ubuntu, `crond` on
> Fedora/RHEL). Manage it portably with `sys svc status cronie`,
> `sys svc enable cronie`, `sys svc start cronie`. Not installed by default on
> all desktops.

- Edit your crontab:

`crontab -e`

- List existing jobs:

`crontab -l`

- Remove all jobs:

`crontab -r`

- Replace from a file:

`crontab {{path/to/file}}`

- Daily at 10:00:

`0 10 * * * {{command_to_execute}}`

- Every 10 minutes:

`*/10 * * * * {{command_to_execute}}`

- Friday 02:30:

`30 2 * * Fri /{{path/to/script.sh}}`

---

# ln

> Create links to files and directories.

- Create a symbolic link:

`ln {{[-s|--symbolic]}} /{{path/to/file_or_directory}} {{path/to/symlink}}`

- Overwrite an existing symlink:

`ln {{[-sf|--symbolic --force]}} /{{path/to/new_file}} {{path/to/symlink}}`

- Create a hard link:

`ln /{{path/to/file}} {{path/to/hardlink}}`

---

# chown

> Change user and group ownership. See also: `chgrp`.

- Change owner:

`sudo chown {{user}} {{path/to/file_or_directory}}`

- Change owner and group:

`sudo chown {{user}}:{{group}} {{path/to/file_or_directory}}`

- Recursively change owner of a directory:

`sudo chown {{[-R|--recursive]}} {{user}} {{path/to/directory}}`

- Change owner of a symlink itself:

`sudo chown {{[-h|--no-dereference]}} {{user}} {{path/to/symlink}}`

---

# chmod

> Change access permissions of a file or directory.

- Give the owner execute:

`chmod u+x {{path/to/file}}`

- Give the owner read+write:

`chmod u+rw {{path/to/file_or_directory}}`

- Remove execute from group:

`chmod g-x {{path/to/file}}`

- Give all users read+execute:

`chmod a+rx {{path/to/file}}`

- Recursively give group/others write:

`chmod {{[-R|--recursive]}} g+w,o+w {{path/to/directory}}`

- Recursively give all read, execute where already executable:

`chmod {{[-R|--recursive]}} a+rX {{path/to/directory}}`
