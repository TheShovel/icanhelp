# Linux Compression Tools & Archiving

## tar (most common)
```bash
tar -czf archive.tar.gz dir/        # gzip (most compatible)
tar -cjf archive.tar.bz2 dir/       # bzip2 (better compression)
tar -cJf archive.tar.xz dir/        # xz (best compression)
tar --zstd -cf archive.tar.zst dir/ # zstd (fast + good)

tar -xzf archive.tar.gz             # extract gzip
tar -xjf archive.tar.bz2            # extract bzip2
tar -xJf archive.tar.xz             # extract xz
tar --zstd -xf archive.tar.zst      # extract zstd

tar -tzf archive.tar.gz             # list contents
tar -tf archive.tar                 # list uncompressed tar
tar -xzf archive.tar.gz -C /path    # extract to path
tar -xzf archive.tar.gz "*.txt"     # extract matching files
tar -czf archive.tar.gz --exclude='*.log' --exclude='*.tmp' dir/   # exclude
tar -czpf archive.tar.gz dir/       # -p preserves permissions
```

## Standalone Compression
```bash
# gzip
gzip file            # compress -> file.gz
gzip -d file.gz      # decompress
gzip -9 file         # best compression
gzip -1 file         # fastest
zcat file.gz         # view without decompressing
gzip -l file.gz      # compression stats

# bzip2
bzip2 file           # compress
bunzip2 file.bz2     # decompress
bzip2 -9 file        # best
bzcat file.bz2       # view

# xz
xz file              # compress
unxz file.xz         # decompress
xz -9e file          # best (extreme)
xz -T 0 file         # use all cores
xz -k file           # keep original
xzcat file.xz        # view
xz -l file.xz        # stats

# zstd
zstd file            # compress (level 3)
zstd -19 file        # best
zstd -1 file         # fastest
zstd -d file.zst     # decompress
zstd -l file.zst     # view info

# lz4 (fastest)
lz4 file             # compress
lz4 -d file.lz4      # decompress
lz4 -9 file          # better
```

## zip / 7z / rar
```bash
zip -r archive.zip dir/     # create
unzip archive.zip           # extract
unzip -l archive.zip        # list
unzip -d dir archive.zip    # extract to dir
zip -9 archive.zip file     # best compression

7z a archive.7z dir/        # (install) create
7z x archive.7z             # (install) extract
7z l archive.7z             # (install) list
7z t archive.7z             # (install) test integrity

rar a archive.rar dir/      # (install) create
rar x archive.rar          # (install) extract
rar t archive.rar          # (install) test
```

## Parallel Compression
```bash
xz -T 0 file                # xz, all cores (built-in)
zstd --threads=0 file       # zstd, all cores (built-in)
pigz -p $(nproc) file       # (install) parallel gzip
pbzip2 file                 # (install) parallel bzip2
```

## Encryption
```bash
gpg -c file                 # GPG symmetric encrypt (prompts for passphrase)
gpg -d file.gpg             # decrypt
gpg --cipher-algo AES256 -c file   # AES256

openssl enc -aes-256-cbc -salt -pbkdf2 -in file -out file.enc
openssl enc -d -aes-256-cbc -in file.enc -out file

zip -e archive.zip file     # password-protect zip
```

## Archive Splitting
```bash
split -b 2G large.tar.gz part_        # split into 2G parts
cat part_* | tar -xzf -               # reassemble + extract
rar a -v2G archive.rar dir/           # (install) RAR volumes
7z a -v2G archive.7z dir/             # (install) 7z volumes
```

## Archive Recovery / Testing
```bash
gzip -t archive.tar.gz       # test gzip integrity
bzip2 -t archive.tar.bz2     # test bzip2
xz -t archive.tar.xz         # test xz
zip -T archive.zip           # test zip
zip -FF archive.zip --out fixed.zip   # repair zip
```

## Special Formats
```bash
# cpio
find dir/ -print | cpio -ov > archive.cpio     # create
cpio -iv < archive.cpio                        # extract

# ar (static libraries)
ar rcs libfoo.a foo.o bar.o    # create
ar x libfoo.a                  # extract
ar t libfoo.a                  # list

# deb / rpm packages
dpkg-deb -x package.deb dir/   # extract deb
rpm2cpio package.rpm | cpio -id  # extract rpm
```

## Useful One-Liners
```bash
find dir/ -type f -exec du -h {} + | sort -rh | head -20   # largest files
find dir/ -mtime -1 -print0 | tar -czf recent.tar.gz --null -T -   # changed files
tar -czf archive.tar.gz --exclude='.git' --exclude='node_modules' dir/  # backup
find . -name '*.tar.*' -exec tar -xf {} \;   # extract all archives
```
