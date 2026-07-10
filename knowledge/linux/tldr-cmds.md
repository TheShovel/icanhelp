# find

> Find files or directories under a directory tree, recursively.
> See also: `fd`.
> More information: <https://manned.org/find>.

- Find files by extension:

`find {{path/to/directory}} -name '{{*.ext}}'`

- Find files matching multiple path/name patterns:

`find {{path/to/directory}} -path '{{*/path/*/*.ext}}' -or -name '{{*pattern*}}'`

- Find directories matching a given name, in case-insensitive mode:

`find {{path/to/directory}} -type d -iname '{{*lib*}}'`

- Find files matching a given pattern, excluding specific paths:

`find {{path/to/directory}} -name '{{*.py}}' -not -path '{{*/site-packages/*}}'`

- Find files matching a given size range, limiting the recursive depth to "1":

`find {{path/to/directory}} -maxdepth 1 -size {{+500k}} -size {{-10M}}`

- Run a command for each file (use `{}` within the command to access the filename):

`find {{path/to/directory}} -name '{{*.ext}}' -exec {{wc -l}} {} \;`

- Find all files modified today and pass the results to a single command as arguments:

`find {{path/to/directory}} -daystart -mtime {{-1}} -exec {{tar -cvf archive.tar}} {} \+`

- Search for either empty files or directories and delete them verbosely:

`find {{path/to/directory}} -type {{f|d}} -empty -delete -print`

---

# grep

> Find patterns in files using `regex`es.
> See also: `rg`, `regex`.
> More information: <https://www.gnu.org/software/grep/manual/grep.html>.

- Search for a pattern within files:

`grep "{{search_pattern}}" {{path/to/file1 path/to/file2 ...}}`

- Search for an exact string (disables `regex`es):

`grep {{[-F|--fixed-strings]}} "{{exact_string}}" {{path/to/file}}`

- Search for a pattern in all files recursively in a directory, ignoring binary files:

`grep {{[-rI|--recursive --binary-files=without-match]}} "{{search_pattern}}" {{path/to/directory}}`

- Print 3 lines of [C]ontext around, [B]efore, or [A]fter each match:

`grep {{--context|--before-context|--after-context}} 3 "{{search_pattern}}" {{path/to/file}}`

- Print file name and line number for each match with color output:

`grep {{[-Hn|--with-filename --line-number]}} --color=always "{{search_pattern}}" {{path/to/file}}`

- Print only the matched text:

`grep {{[-o|--only-matching]}} "{{search_pattern}}" {{path/to/file}}`

- Read data from `stdin` and do not print lines that match a pattern:

`cat {{path/to/file}} | grep {{[-v|--invert-match]}} "{{search_pattern}}"`

- Use extended `regex`es (supports `?`, `+`, `{}`, `()`, and `|`), in case-insensitive mode:

`grep {{[-Ei|--extended-regexp --ignore-case]}} "{{search_pattern}}" {{path/to/file}}`

---

# sed

> Edit text in a scriptable manner.
> See also: `awk`, `ed`.
> More information: <https://manned.org/sed.1posix>.

- Replace all `apple` (basic `regex`) occurrences with `mango` (basic `regex`) in all input lines and print the result to `stdout`:

`{{command}} | sed 's/apple/mango/g'`

- Execute a specific script [f]ile and print the result to `stdout`:

`{{command}} | sed -f {{path/to/script.sed}}`

- Print just a first line to `stdout`:

`{{command}} | sed -n '1p'`

---

# awk

> A versatile programming language for working on files.
> Note: Different implementations of AWK often make this a symlink of their binary.
> See also: `gawk`.
> More information: <https://github.com/onetrueawk/awk>.

- Print the fifth column (a.k.a. field) in a space-separated file:

`awk '{print $5}' {{path/to/file}}`

- Print the second column of the lines containing "foo" in a space-separated file:

`awk '/{{foo}}/ {print $2}' {{path/to/file}}`

- Print the last column of each line in a file, using a comma (instead of space) as a field separator:

`awk -F ',' '{print $NF}' {{path/to/file}}`

- Sum the values in the first column of a file and print the total:

`awk '{s+=$1} END {print s}' {{path/to/file}}`

- Print every third line starting from the first line:

`awk 'NR%3==1' {{path/to/file}}`

- Print different values based on conditions:

`awk '{if ($1 == "foo") print "Exact match foo"; else if ($1 ~ "bar") print "Partial match bar"; else print "Baz"}' {{path/to/file}}`

- Print all the lines which the 10th column value is between a min and a max:

`awk '($10 >= {{min_value}} && $10 <= {{max_value}})' {{path/to/file}}`

- Print table of users with UID >=1000 with header and formatted output, using colon as separator (`%-20s` mean: 20 left-align string characters, `%6s` means: 6 right-align string characters):

`awk 'BEGIN {FS=":";printf "%-20s %6s %25s\n", "Name", "UID", "Shell"} $4 >= 1000 {printf "%-20s %6d %25s\n", $1, $4, $7}' /etc/passwd`

---

# tar

> Archiving utility.
> Often combined with a compression method, such as `gzip` or `bzip2`.
> More information: <https://www.gnu.org/software/tar/manual/tar.html>.

- [c]reate an archive and write it to a [f]ile:

`tar cf {{path/to/target.tar}} {{path/to/file1 path/to/file2 ...}}`

- [c]reate a g[z]ipped archive and write it to a [f]ile:

`tar czf {{path/to/target.tar.gz}} {{path/to/file1 path/to/file2 ...}}`

- [c]reate a g[z]ipped (compressed) archive from a directory using relative paths:

`tar czf {{path/to/target.tar.gz}} {{[-C|--directory]}} {{path/to/directory}} .`

- E[x]tract a (compressed) archive [f]ile into the current directory [v]erbosely:

`tar xvf {{path/to/source.tar[.gz|.bz2|.xz]}}`

- E[x]tract a (compressed) archive [f]ile into the target directory:

`tar xf {{path/to/source.tar[.gz|.bz2|.xz]}} {{[-C|--directory]}} {{path/to/directory}}`

- [c]reate a compressed archive and write it to a [f]ile, using the file extension to [a]utomatically determine the compression program:

`tar caf {{path/to/target.tar.xz}} {{path/to/file1 path/to/file2 ...}}`

- Lis[t] the contents of a tar [f]ile [v]erbosely:

`tar tvf {{path/to/source.tar}}`

- E[x]tract files matching a pattern from an archive [f]ile:

`tar xf {{path/to/source.tar}} --wildcards "{{*.html}}"`

---

# rsync

> Transfer files either to or from a remote host (but not between two remote hosts), by default using SSH.
> To specify a remote path, use `user@host:path/to/file_or_directory`.
> More information: <https://download.samba.org/pub/rsync/rsync.1>.

- Transfer a file (use `--dry-run` to simulate the transfer):

`rsync {{path/to/source}} {{path/to/destination}}`

- Use archive mode (recursively copy directories, copy symlinks without resolving, and preserve permissions, ownership, and modification times):

`rsync {{[-a|--archive]}} {{path/to/source}} {{path/to/destination}}`

- Compress the data as it is sent to the destination, display verbose and human-readable progress, and keep partially transferred files if interrupted:

`rsync {{[-zvhP|--compress --verbose --human-readable --partial --progress]}} {{path/to/source}} {{path/to/destination}}`

- Recursively copy directories and ensure each file is fully committed to disk rather than remaining in RAM:

`rsync {{[-r|--recursive]}} --fsync {{path/to/source}} {{path/to/destination}}`

- Transfer directory contents, but not the directory itself:

`rsync {{[-r|--recursive]}} {{path/to/source}}/ {{path/to/destination}}`

- Use archive mode, resolve symlinks, and skip files that are newer on the destination:

`rsync {{[-auL|--archive --update --copy-links]}} {{path/to/source}} {{path/to/destination}}`

- Transfer a directory from a remote host running `rsyncd` and delete files on the destination that do not exist on the source:

`rsync {{[-r|--recursive]}} --delete rsync://{{host}}:{{path/to/source}} {{path/to/destination}}`

- Transfer a file over SSH using a different port than the default (22) and show global progress:

`rsync {{[-e|--rsh]}} 'ssh -p {{port}}' --info=progress2 {{host}}:{{path/to/source}} {{path/to/destination}}`

---

# ssh

> Secure Shell is a protocol used to securely log onto remote systems.
> It can be used for logging or executing commands on a remote server.
> More information: <https://man.openbsd.org/ssh>.

- Connect to a remote server:

`ssh {{username}}@{{remote_host}}`

- Connect to a remote server with a specific [i]dentity (private key):

`ssh {{username}}@{{remote_host}} -i {{path/to/key_file}}`

- Connect to a remote server with IP `10.0.0.1` and using a specific [p]ort (Note: `10.0.0.1` can be shortened to `10.1`):

`ssh {{username}}@10.0.0.1 -p {{2222}}`

- Run a command on a remote server with a [t]ty allocation allowing interaction with the remote command:

`ssh {{username}}@{{remote_host}} -t {{command}} {{command_arguments}}`

- SSH tunneling: [D]ynamic port forwarding (SOCKS proxy on `localhost:1080`):

`ssh {{username}}@{{remote_host}} -D {{1080}}`

- SSH tunneling: Forward a specific port (`localhost:9999` to `example.org:80`) along with disabling pseudo-[T]ty allocation and executio[N] of remote commands:

`ssh {{username}}@{{remote_host}} -L {{9999}}:{{example.org}}:{{80}} -N -T`

- SSH [J]umping: Connect through a jumphost to a remote server (Multiple jump hops may be specified separated by comma characters):

`ssh {{username}}@{{remote_host}} -J {{username}}@{{jump_host}}`

- Close a hanged session:

`<Enter><~><.>`

---

# scp

> Secure copy.
> Copy files between hosts using Secure Copy Protocol over SSH.
> More information: <https://man.openbsd.org/scp>.

- Copy a local file to a remote host:

`scp {{path/to/local_file}} {{remote_host}}:{{path/to/remote_file}}`

- Use a specific port when connecting to the remote host:

`scp -P {{port}} {{path/to/local_file}} {{remote_host}}:{{path/to/remote_file}}`

- Copy a file from a remote host to a local directory:

`scp {{remote_host}}:{{path/to/remote_file}} {{path/to/local_directory}}`

- Recursively copy the contents of a directory from a remote host to a local directory:

`scp -r {{remote_host}}:{{path/to/remote_directory}} {{path/to/local_directory}}`

- Copy a file between two remote hosts transferring through the local host:

`scp -3 {{host1}}:{{path/to/remote_file}} {{host2}}:{{path/to/remote_directory}}`

- Use a specific username when connecting to the remote host:

`scp {{path/to/local_file}} {{remote_username}}@{{remote_host}}:{{path/to/remote_directory}}`

- Use a specific SSH private key for authentication with the remote host:

`scp -i {{~/.ssh/private_key}} {{path/to/local_file}} {{remote_host}}:{{path/to/remote_file}}`

- Use a specific proxy when connecting to the remote host:

`scp -J {{proxy_username}}@{{proxy_host}} {{path/to/local_file}} {{remote_host}}:{{path/to/remote_file}}`

---

# curl

> Transfers data from or to a server.
> Supports most protocols, including HTTP, HTTPS, FTP, SCP, etc.
> See also: `wcurl`, `wget`.
> More information: <https://curl.se/docs/manpage.html>.

- Make an HTTP GET request and dump the contents in `stdout`:

`curl {{https://example.com}}`

- Make an HTTP GET request, follow any `3xx` redirects, and dump the reply headers and contents to `stdout`:

`curl {{[-L|--location]}} {{[-D|--dump-header]}} - {{https://example.com}}`

- Download a file, saving the output under the filename indicated by the URL:

`curl {{[-O|--remote-name]}} {{https://example.com/filename.zip}}`

- Send form-encoded data (POST request of type `application/x-www-form-urlencoded`). Use `--data @file_name` or `--data @'-'` to read from `stdin`:

`curl {{[-X|--request]}} POST {{[-d|--data]}} '{{name=bob}}' {{http://example.com/form}}`

- Send a request with an extra header, using a custom HTTP method and over a proxy (such as BurpSuite), ignoring insecure self-signed certificates:

`curl {{[-k|--insecure]}} {{[-x|--proxy]}} {{http://127.0.0.1:8080}} {{[-H|--header]}} '{{Authorization: Bearer token}}' {{[-X|--request]}} {{GET|PUT|POST|DELETE|PATCH|...}} {{https://example.com}}`

- Send data in JSON format, specifying the appropriate Content-Type header:

`curl {{[-d|--data]}} '{{{"name":"bob"}}}' {{[-H|--header]}} '{{Content-Type: application/json}}' {{http://example.com/users/1234}}`

- Pass client certificate and private key for the request, skipping certificate validation:

`curl {{[-E|--cert]}} {{client.pem}} --key {{key.pem}} {{[-k|--insecure]}} {{https://example.com}}`

- Resolve a hostname to a custom IP address, with verbose output (similar to editing the `/etc/hosts` file for custom DNS resolution):

`curl {{[-v|--verbose]}} --resolve {{example.com}}:{{80}}:{{127.0.0.1}} {{http://example.com}}`

---

# wget

> Download files from the Web.
> Supports HTTP, HTTPS, and FTP.
> See also: `wcurl`, `curl`.
> More information: <https://www.gnu.org/software/wget/manual/wget.html>.

- Download the contents of a URL to a file (named "foo" in this case):

`wget {{https://example.com/foo}}`

- Download the contents of a URL to a file (named "bar" in this case):

`wget {{[-O|--output-document]}} {{bar}} {{https://example.com/foo}}`

- Download a single web page and all its resources with 3-second intervals between requests (scripts, stylesheets, images, etc.):

`wget {{[-pkw|--page-requisites --convert-links --wait]}} 3 {{https://example.com/some_page.html}}`

- Download all listed files within a directory and its sub-directories (does not download embedded page elements):

`wget {{[-mnp|--mirror --no-parent]}} {{https://example.com/some_path/}}`

- Limit the download speed and the number of connection retries:

`wget --limit-rate {{300k}} {{[-t|--tries]}} {{100}} {{https://example.com/some_path/}}`

- Download a file from an HTTP server using Basic Auth (also works for FTP):

`wget --user {{username}} --password {{password}} {{https://example.com}}`

- Continue an incomplete download:

`wget {{[-c|--continue]}} {{https://example.com}}`

- Download all URLs stored in a text file to a specific directory:

`wget {{[-P|--directory-prefix]}} {{path/to/directory}} {{[-i|--input-file]}} {{path/to/URLs.txt}}`

---

# crontab

> Schedule cron jobs to run on a time interval for the current user.
> More information: <https://manned.org/crontab>.

- [e]dit the crontab file for the current user:

`crontab -e`

- [e]dit the crontab file for a specific [u]ser:

`sudo crontab -e -u {{user}}`

- Replace the current crontab with the contents of the given file:

`crontab {{path/to/file}}`

- [l]ist existing cron jobs for the current user:

`crontab -l`

- [r]emove all cron jobs for the current user:

`crontab -r`

- Sample cron job which runs at 10:00 every day (* means any value):

`0 10 * * * {{command_to_execute}}`

- Sample cron job which runs a command every 10 minutes:

`*/10 * * * * {{command_to_execute}}`

- Sample cron job which runs a certain script at 02:30 every Friday:

`30 2 * * Fri /{{path/to/script.sh}}`

---

404: Not Found
---

404: Not Found
---

# ln

> Create links to files and directories.
> More information: <https://www.gnu.org/software/coreutils/manual/html_node/ln-invocation.html>.

- Create a symbolic link to a file or directory:

`ln {{[-s|--symbolic]}} /{{path/to/file_or_directory}} {{path/to/symlink}}`

- Create a symbolic link relative to where the link is located:

`ln {{[-s|--symbolic]}} {{path/to/file_or_directory}} {{path/to/symlink}}`

- Overwrite an existing symbolic link to point to a different file:

`ln {{[-sf|--symbolic --force]}} /{{path/to/new_file}} {{path/to/symlink}}`

- Create a hard link to a file:

`ln /{{path/to/file}} {{path/to/hardlink}}`

---

# chown

> Change user and group ownership of files and directories.
> See also: `chgrp`.
> More information: <https://www.gnu.org/software/coreutils/manual/html_node/chown-invocation.html>.

- Change the owner user of a file/directory:

`sudo chown {{user}} {{path/to/file_or_directory}}`

- Change the owner user and group of a file/directory:

`sudo chown {{user}}:{{group}} {{path/to/file_or_directory}}`

- Change the owner user and group to both have the name `user`:

`sudo chown {{user}}: {{path/to/file_or_directory}}`

- Change the group of a file to a group that the current user belongs to:

`chown :{{group}} {{path/to/file_or_directory}}`

- Recursively change the owner of a directory and its contents:

`sudo chown {{[-R|--recursive]}} {{user}} {{path/to/directory}}`

- Change the owner of a symbolic link:

`sudo chown {{[-h|--no-dereference]}} {{user}} {{path/to/symlink}}`

- Change the owner of a file/directory to match a reference file:

`sudo chown --reference {{path/to/reference_file}} {{path/to/file_or_directory}}`

---

# chmod

> Change the access permissions of a file or directory.
> More information: <https://www.gnu.org/software/coreutils/manual/html_node/chmod-invocation.html>.

- Give the [u]ser who owns a file the right to e[x]ecute it:

`chmod u+x {{path/to/file}}`

- Give the [u]ser rights to [r]ead and [w]rite to a file/directory:

`chmod u+rw {{path/to/file_or_directory}}`

- Remove e[x]ecutable rights from the [g]roup:

`chmod g-x {{path/to/file}}`

- Give [a]ll users rights to [r]ead and e[x]ecute:

`chmod a+rx {{path/to/file}}`

- Give [o]thers (not in the file owner's group) the same rights as the [g]roup:

`chmod o=g {{path/to/file}}`

- Remove all rights from [o]thers:

`chmod o= {{path/to/file}}`

- Change permissions recursively giving [g]roup and [o]thers the ability to [w]rite:

`chmod {{[-R|--recursive]}} g+w,o+w {{path/to/directory}}`

- Recursively give [a]ll users [r]ead permissions to files. Also give e[X]ecute permissions to files that have at least one execution permission and to all sub-directories:

`chmod {{[-R|--recursive]}} a+rX {{path/to/directory}}`

---

