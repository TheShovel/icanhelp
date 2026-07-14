# NFS & SMB/CIFS Network File Systems

## NFS

### Server

```bash
# Install: sys pkg install nfs-kernel-server   (Debian)
#          sys pkg install nfs-utils            (RHEL/Arch)
# /etc/exports
/export/data  client1(rw,sync,no_subtree_check)
/export/backup 192.168.1.0/24(ro,sync,all_squash,anonuid=1000,anongid=1000)

exportfs -ra                  # re-export all
exportfs -s                   # show current exports
sys svc enable --now nfs-server
```

Common export options: `rw`/`ro`, `sync` (safe write), `async` (fast), `root_squash` (default, maps root→nobody), `no_root_squash` (trust client root — avoid), `all_squash`, `no_subtree_check`.

### Client

```bash
showmount -e server            # list exports
mount -t nfs -o rw,vers=4,hard server:/export/data /mnt/data
# fstab:
server:/export/data /mnt/data nfs rw,vers=4,hard,_netdev 0 0
```
NFSv4 uses a single port (2049); NFSv3 also needs rpcbind (111).

### Troubleshoot
```bash
exportfs -v                    # verbose server exports
rpcinfo -p server              # RPC services
nfsstat -c                     # client stats
mount | grep nfs               # verify mount options
# Stale handle: exportfs -ra (server); umount -f /mnt; remount (client)
```

## SMB/CIFS

### Server

```bash
# Install: sys pkg install samba   (Debian/RHEL/Arch)
# /etc/samba/smb.conf
[share]
    path = /srv/samba/data
    browseable = yes
    read only = no
    valid users = alice bob
    create mask = 0664
    directory mask = 0775

sudo smbpasswd -a alice        # add user (needs existing Linux user)
sudo pdbedit -L                # list users
testparm                       # validate config
sys svc enable --now smbd nmbd
```

### Client

```bash
mount -t cifs //server/share /mnt/share -o username=alice
# credentials file (/etc/cifs-creds: username=,password=,domain=)
mount -t cifs //server/share /mnt/share -o credentials=/etc/cifs-creds,uid=1000,gid=1000,file_mode=0664,dir_mode=0775
# fstab: //server/share /mnt/share cifs credentials=/etc/cifs-creds 0 0
smbclient //server/share -U alice -c 'ls'
```

### Troubleshoot
```bash
testparm -v
smbclient -L server -U alice
pdbedit -L                     # check Samba users
ls -la /srv/samba/share       # check Unix perms
```

## AutoFS (on-demand mount)

```bash
# /etc/auto.master
/mnt/nfs   /etc/auto.nfs
# /etc/auto.nfs
data   -rw,vers=4 server:/export/data
sys svc enable --now autofs
```

## Security

```bash
# NFSv4 + Kerberos: /export/secure client(rw,sec=krb5p,sync)
# SMB minimum protocol: server min protocol = SMB2; smb encrypt = required
```
