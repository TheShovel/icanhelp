# NFS and SMB/CIFS Network File Systems

## NFS (Network File System)

### Server Setup

#### Install Packages
```bash
# Debian/Ubuntu
apt install nfs-kernel-server rpcbind

# RHEL/Fedora
dnf install nfs-utils rpcbind
```

#### Export Configuration
```
# /etc/exports
/export/data client1(rw,sync,no_subtree_check)
/export/backup 192.168.1.0/24(ro,sync,all_squash,anonuid=1000,anongid=1000)
/home/user 192.168.1.100(rw,sync,no_root_squash)
/var/www  *(rw,fsid=0,insecure,no_subtree_check,async)
```

#### Export Options
- `rw` - Read-write access
- `ro` - Read-only access
- `sync` - Write changes before replying
- `async` - Reply before write completes
- `no_root_squash` - Trust root on client
- `root_squash` - Map root to nobody (default)
- `all_squash` - Map all users to anonymous
- `anonuid=uid,anongid=gid` - Set anonymous user/group
- `no_subtree_check` - Disable subtree checking (performance)
- `subtree_check` - Enable subtree checking (default)
- `crossmnt` - Allow crossing filesystem boundaries
- `fsid=N` - Specify filesystem ID
- `insecure` - Allow high ports (non-privileged)
- `secure` - Require privileged ports (default)
- `wdelay` - Delay writes for better performance
- `nohide` - Export mounted filesystems

#### Apply Exports
```bash
exportfs -ra      # Re-export all
exportfs -rv     # Verbose re-export
exportfs -s      # Show current exports
exportfs -u client1:/export/data  # Unexport specific
```

#### NFS Server Services
```bash
# systemd
systemctl enable --now nfs-server
systemctl enable --now rpcbind  # Required for NFSv3

# Check services
systemctl status nfs-server rpcbind

# Firewall
firewall-cmd --add-service=nfs --permanent
firewall-cmd --add-service=mountd --permanent
firewall-cmd --add-service=rpc-bind --permanent
firewall-cmd --reload
```

### NFS Client

#### Mount Options
```bash
# Basic mount
mount -t nfs server:/export/data /mnt/data

# With options
mount -t nfs -o rw,vers=4,hard,intr server:/export/data /mnt/data

# fstab entry
server:/export/data /mnt/data nfs rw,vers=4,hard,intr,_netdev 0 0
```

#### Common Mount Options
- `vers=3` or `vers=4` - NFS version
- `rw` or `ro` - Read-write/read-only
- `hard` - Retry indefinitely (default)
- `soft` - Give up after timeout
- `intr` - Allow interrupts on hard mounts
- `nointr` - Ignore interrupts
- `timeo=N` - Timeout in deciseconds (hard)
- `retrans=N` - Number of retransmissions
- `rsize=N` - Read buffer size (default 1048576)
- `wsize=N` - Write buffer size (default 1048576)
- `tcp` - Use TCP (NFSv3, default)
- `udp` - Use UDP (NFSv3, less common)
- `_netdev` - Wait for network (fstab)
- `noauto` - Don't mount automatically
- `bg` - Background retry on mount failure
- `fg` - Foreground retry (default)

#### Check Mounts
```bash
showmount -e server     # List exports
showmount -e localhost  # Local exports
nfsstat -c             # Client stats
nfsstat -s             # Server stats
```

### NFS Versions

#### NFSv3
- Uses rpcbind (portmapper)
- Supports UDP and TCP
- Separate MOUNT daemon required
- Port 111 (rpcbind), 2049 (nfs), various for mount/statd

#### NFSv4
- Single port (2049) only
- No rpcbind needed
- Better performance and security
- Built-in Kerberos support

#### Version Selection
```bash
# Client
mount -t nfs -o vers=4 server:/path /mnt

# Server - /etc/default/nfs-kernel-server
RPCNFSDOPTS="-N 2 -N 3 -N 4"
# Only enable versions you need
```

## SMB/CIFS (Windows File Sharing)

### Server Setup

#### Install Packages
```bash
# Debian/Ubuntu
apt install samba

# RHEL/Fedora
dnf install samba samba-client samba-common
```

#### Basic Configuration
```
# /etc/samba/smb.conf
[global]
    workgroup = WORKGROUP
    server string = %h server
    netbios name = server
    security = user
    map to guest = bad user
    dns proxy = no
    log file = /var/log/samba/log.%m
    max log size = 1000
    syslog = 0
    panic action = /usr/share/samba/panic-action %d

# Share definitions
[data]
    path = /srv/samba/data
    browseable = yes
    writable = yes
    guest ok = no
    read only = no
    valid users = alice bob
    create mask = 0664
    directory mask = 0775

[public]
    path = /srv/samba/public
    browseable = yes
    writable = yes
    guest ok = yes
    guest only = yes
    read only = no
    force create mode = 0666
    force directory mode = 0777
```

#### SMB Share Options
- `path = /path` - Share path
- `browseable = yes/no` - Visible in network
- `writable = yes/no` - Write access
- `read only = yes/no` - Opposite of writable
- `guest ok = yes/no` - Allow guest access
- `guest only = yes/no` - Only guest access
- `valid users = alice bob` - Allowed users
- `invalid users = root` - Blocked users
- `write list = alice` - Users with write access
- `create mask = 0664` - New file permissions
- `directory mask = 0775` - New directory permissions
- `force create mode = 0666` - Force permissions regardless of umask
- `force directory mode = 0777` - Force directory permissions
- `force user = www-data` - Force ownership
- `force group = www-data` - Force group
- `hosts allow = 192.168.1.` - Allowed hosts
- `hosts deny = 0.0.0.0/0` - Denied hosts

#### Samba Users
```bash
# Add user (requires existing Linux user)
smbpasswd -a alice

# Enable user
smbpasswd -e alice

# Disable user
smbpasswd -d alice

# Delete user
smbpasswd -x alice

# List users
pdbedit -L

# Reset password
smbpasswd alice
```

#### Samba Services
```bash
systemctl enable --now smbd nmbd

# Or with systemd socket activation
systemctl enable --now samba

# Check
systemctl status smbd nmbd
testparm  # Validate configuration
```

### SMB Client

#### Mount with CIFS
```bash
# Basic mount
mount -t cifs //server/share /mnt/share -o username=alice

# With credentials file
mount -t cifs //server/share /mnt/share -o credentials=/etc/cifs-creds

# fstab entry
//server/share /mnt/share cifs credentials=/etc/cifs-creds,iocharset=utf8,uid=1000,gid=1000,file_mode=0664,dir_mode=0775 0 0
```

#### CIFS Mount Options
- `username=name` - Username
- `password=pass` - Password (not recommended)
- `credentials=file` - Credentials file (recommended)
- `domain=DOMAIN` - Domain for authentication
- `uid=1000` - Owner UID
- `gid=1000` - Owner GID
- `file_mode=0664` - File permissions
- `dir_mode=0775` - Directory permissions
- `iocharset=utf8` - Character set
- `nounix` - Disable Unix extensions
- `noserverino` - Use client-side inode numbers
- `noperm` - Skip permission checks
- `multiuser` - Support multiple credentials
- `soft` - Soft mount (timeout)
- `hard` - Hard mount (retry)
- `rsize=N` - Read size
- `wsize=N` - Write size

#### Credentials File
```bash
# /etc/cifs-creds
username=alice
password=secret
domain=WORKGROUP
```

#### SMB Client Commands
```bash
smbclient //server/share -U alice
# FTP-like interface

smbclient -L server -U alice
# List shares

mount -t cifs //server/share /mnt/share -o username=alice,uid=$(id -u)
```

## AutoFS (Automatic Mounting)

### Setup
```bash
# Install
apt install autofs
# or
dnf install autofs

# /etc/auto.master
/mnt/nfs    /etc/auto.nfs
/mnt/cifs   /etc/auto.cifs

# /etc/auto.nfs
data    -rw,vers=4 server:/export/data
backup  -ro,vers=4 server:/export/backup

# /etc/auto.cifs
share   -rw,credentials=/etc/cifs-creds ://server/share
```

### Usage
```bash
systemctl enable --now autofs
ls /mnt/nfs/data  # Auto-mounts on access
ls /mnt/cifs/share
```

## Security

### NFS Security
```bash
# Use Kerberos
# /etc/exports
/export/secure client(rw,sec=krb5p,sync)

# NFSv4 with id mapping
# /etc/idmapd.conf
[Mapping]
Nobody-User = nfsnobody
Nobody-Group = nfsnobody
```

### SMB Security
```bash
# /etc/samba/smb.conf
[global]
    server min protocol = SMB2
    client min protocol = SMB2
    server signing = auto
    client signing = auto
    smb encrypt = required  # For specific shares
```

### Firewall Ports

#### NFS Ports
```bash
# NFSv3
firewall-cmd --add-port=111/tcp --add-port=111/udp
firewall-cmd --add-port=2049/tcp
firewall-cmd --add-port=20048/tcp  # mountd
firewall-cmd --add-port=32768-32867/tcp  # statd

# NFSv4 (single port)
firewall-cmd --add-port=2049/tcp
```

#### SMB Ports
```bash
firewall-cmd --add-service=samba
# TCP 139, 445
```

## Troubleshooting

### NFS Debug
```bash
# Server
exportfs -v      # Verbose exports
rpcinfo -p localhost  # RPC services
nfsstat -s     # Server stats
tail -f /var/log/syslog | grep nfs  # Logs

# Client
rpcinfo -p server
showmount -e server
nfsstat -c
mount | grep nfs  # Verify mount options
```

### SMB Debug
```bash
testparm -v       # Validate config
smbclient -L server -N  # List shares without auth
smbclient //server/share -U alice -c 'ls'  # Test connection
log.smbd          # Samba logs
```

### Common Issues

#### NFS Stale File Handle
```bash
# Server side
exportfs -ra

# Client side
umount -f /mnt/nfs/data
mount -t nfs server:/path /mnt/nfs/data
```

#### SMB Permission Denied
```bash
# Check Samba users
pdbedit -L

# Check Unix permissions
ls -la /srv/samba/share

# Check SELinux/AppArmor
setsebool -P samba_export_all_rw on
```