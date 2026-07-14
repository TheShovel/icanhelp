# Linux Compression Tools & Archiving

## Common Archive Formats

| Format | Extension | Compression | Best for |
|--------|-----------|-------------|----------|
| tar + gzip | .tar.gz | Moderate | Compatibility |
| tar + bzip2 | .tar.bz2 | Good | Size |
| tar + xz | .tar.xz | Excellent | Size |
| tar + zstd | .tar.zst | Fast + good | Speed + size |
| tar only | .tar | None | Speed |
| ZIP | .zip | Moderate | Windows compatibility |

## tar Commands

```bash
# Create archives
tar -czf archive.tar.gz dir/            # gzip (most common)
tar -cjf archive.tar.bz2 dir/           # bzip2 (better compression)
tar -cJf archive.tar.xz dir/            # xz (best compression)
tar --zstd -cf archive.tar.zst dir/     # zstd (fast)

# Extract archives
tar -xzf archive.tar.gz
tar -xjf archive.tar.bz2
tar -xJf archive.tar.xz
tar --zstd -xf archive.tar.zst

# List contents
tar -tzf archive.tar.gz
tar -tf archive.tar

# Extract specific files
tar -xzf archive.tar.gz path/to/file
tar -xzf archive.tar.gz "*.txt"

# Exclude files
tar -czf archive.tar.gz --exclude="*.log" --exclude="*.tmp" dir/

# Preserve permissions
tar -czpf archive.tar.gz dir/           # -p preserves permissions
```

## Standalone Compression

### gzip
```bash
gzip file                               # Compress
gzip -d file.gz                         # Decompress
gzip -9 file                            # Best compression
gzip -1 file                            # Fastest
zcat file.gz                            # View without decompressing
```

### bzip2
```bash
bzip2 file                              # Compress
bunzip2 file.bz2                        # Decompress
bzip2 -9 file                           # Best compression
bzcat file.bz2                          # View
```

### xz (lzma)
```bash
xz file                                 # Compress
unxz file.xz                            # Decompress
xz -9e file                            # Best compression (extreme)
xz -T 0 file                            # Use all cores
xz -k file                              # Keep original
xzcat file.xz                           # View
```

### zstd (Facebook's Zstandard)
```bash
zstd file                               # Compress (level 3)
zstd -19 file                           # Best compression
zstd -1 file                            # Fastest
zstd -d file.zst                        # Decompress
unzstd file.zst
zstd -l file                            # View
zstd -c file > file.zst                 # Stream to stdout
```

### lz4 (Fastest)
```bash
lz4 file                                # Compress
lz4 -d file.lz4                         # Decompress
lz4 -9 file                             # Better compression
unlz4 file.lz4
lz4cat file.lz4                         # View
```

## archivers

### zip
```bash
zip archive.zip file1 file2               # Create
zip -r archive.zip dir/                 # Recursive
unzip archive.zip                       # Extract
unzip -l archive.zip                    # List
unzip -d dir archive.zip                # Extract to dir
zip -9 archive.zip file                 # Best compression
zipcloak archive.zip                    # Encrypt
```

### 7z
```bash
7z a archive.7z dir/                    # Create
7z x archive.7z                       # Extract
7z l archive.7z                         # List
7z t archive.7z                         # Test integrity
7z a -t7z -mx=9 archive.7z dir/       # Best compression
7z a -t7z -m0=lzma2 -mx=9 archive.7z dir/
7z a -tzip archive.zip dir/             # Create zip
7z a -txz archive.tar.xz dir/           # Create xz tar
```

### rar
```bash
rar a archive.rar dir/                  # Create
rar x archive.rar                       # Extract
rar l archive.rar                       # List
rar t archive.rar                       # Test
rar a -m5 archive.rar dir/             # Compression level 5
```

## Comparison (Quick Reference)

```bash
# Time comparison
time tar -czf archive.tar.gz dir/
time tar -cJf archive.tar.xz dir/
time tar -I zstd -cf archive.tar.zst dir/
time zip -9 archive.zip dir/

# Size comparison
ls -lh archive.*
```

## Compression Levels

| Tool | Levels | Speed (fast→slow) | Compression (worse→better) |
|------|--------|-------------------|---------------------------|
| gzip | 1-9 | gz1 > gz9 | gz9 > gz1 |
| bzip2 | 1-9 | bz21 > bz29 | bz29 > bz21 |
| xz | 0-9, e | xz1 > xz9 | xz9e > xz9 > xz1 |
| zstd | 1-19 | zstd1 > zstd19 | zstd19 > zstd1 |
| lz4 | 1-9 | lz41 > lz49 | lz49 > lz41 |

## Parallel Compression

```bash
# pigz - parallel gzip
sudo apt install pigz
pigz -p $(nproc) file

# pbzip2 - parallel bzip2
sudo apt install pbzip2
pbzip2 file

# pxz - parallel xz
sudo apt install pxz
pxz file

# Using all cores by default
xz -T 0 file
zstd --threads=0 file
```

## Archive Splitting

```bash
# Split large archives
split -b 2G large.tar.gz part_
cat part_* | tar -xzf -

# Or with tar
tar -czf - dir/ | split -b 2G - archive.tar.gz.
cat archive.tar.gz.* | tar -xzf -

# Create split with specific size
rar a -v2G archive.rar dir/            # RAR volumes
7z a -v2G archive.7z dir/             # 7z volumes
```

## Encryption

```bash
# GPG symmetric encryption
gpg -c file                            # Encrypt
gpg -d file.gpg                        # Decrypt
gpg --cipher-algo AES256 -c file        # AES256

# OpenSSL encryption
openssl enc -aes-256-cbc -salt -pbkdf2 -in file -out file.enc
openssl enc -d -aes-256-cbc -in file.enc -out file

# zip encryption
zip -e archive.zip file                 # Password protect
zip -P password archive.zip file        # From command line (visible in ps)

# 7z encryption
7z a -p archive.7z dir/               # Password prompt
7z a -pSECRET archive.7z dir/          # Password on CLI
```

## Archive Analysis

```bash
# Analyze compression
gzip -l archive.tar.gz                  # gzip stats
xz -l archive.tar.xz                    # xz stats
zip -l archive.zip                      # zip stats

# Compression ratio
ls -lh archive.*
awk '{print $5/8}' <<< "$(xz -l file.xz | tail -1)"

# Compare sizes
du -h --apparent-size archive.*
```

## Archive Recovery

```bash
# Recover corrupted gzip
gzrecover archive.tar.gz

# Recover corrupted zip
zip -FF archive.zip --out fixed.zip      # Fix
zip -r fixed.zip broken.zip             # Repair

# Test archives
gzip -t archive.tar.gz
bzip2 -t archive.tar.bz2
xz -t archive.tar.xz
zip -t archive.zip
7z t archive.7z
```

## Special Formats

### cpio (Unix archive)
```bash
# Create
find dir/ -print | cpio -ov > archive.cpio

# Extract
cpio -iv < archive.cpio

# With compression
find dir/ -print | cpio -ov | xz > archive.cpio.xz
xzcat archive.cpio.xz | cpio -iv
```

### ar (static libraries)
```bash
ar rcs libfoo.a foo.o bar.o             # Create
ar x libfoo.a                           # Extract
ar t libfoo.a                           # List
```

### deb/rpm packages
```bash
# deb
dpkg-deb -x package.deb dir/            # Extract
dpkg-deb -e package.deb               # Extract control files
dpkg-deb -b dir/ package.deb          # Build

# rpm
rpm2cpio package.rpm | cpio -id         # Extract
rpm -qpl package.rpm                   # List
```

## Useful One-Liners

```bash
# Find largest files before archiving
find dir/ -type f -exec du -h {} + | sort -rh | head -20

# Archive only changed files (backup)
find dir/ -mtime -1 -print0 | tar -czf recent.tar.gz --null -T -

# Extract archive while preserving permissions
tar -xzpf archive.tar.gz

# Create archive excluding git and cache
tar -czf archive.tar.gz --exclude='.git' --exclude='node_modules' --exclude='.cache' dir/

# Compress all logs in directory
find . -name "*.log" -exec xz -9 {} +

# Decompress all archives recursively
find . -name "*.tar.*" -exec tar -xf {} \;
```