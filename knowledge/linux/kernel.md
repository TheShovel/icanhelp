# GNU/Linux Kernel & System Programming

Conceptual reference for how the kernel and system calls work. For tracing tools see `ebpf.md`.

## Kernel Architecture

- **Monolithic** (Linux): single kernel binary in ring 0; fast syscalls, but a driver bug can panic the system. Contrast with microkernel (drivers in user space — more stable, slower).
- **User vs kernel space**: user space = ring 3 (a crash kills only that process); kernel space = ring 0 (a crash = panic). Transition via syscalls (~400 on x86_64). Kernel protects its memory; it accesses user memory only via `copy_from_user`/`copy_to_user`.
- **Versioning**: check with `uname -r`. LTS releases every 2 years, supported ~6 years.
- **Loadable modules**: `.ko` files in `/lib/modules/$(uname -r)/`. Insert: `insmod`/`modprobe`; remove: `rmmod`; list: `lsmod`; info: `modinfo`. See `kernel-modules.md`.

## System Calls (man 2)

`open/close/read/write`, `stat/fstat/lstat`, `mmap/munmap`, `fork/execve/wait/exit`, `socket/bind/listen/accept`, `ioctl`, `fcntl`, `select/poll/epoll` (epoll most scalable).

## Process Model

- **fork()**: child is a copy-on-write duplicate; returns 0 in child, PID in parent.
- **exec()**: replaces the process image; all variants call `execve`.
- **Zombie**: child exited, parent hasn't `wait()`ed — shows as `Z` in `ps`; reap via `wait()`/`waitpid()` or `SIGCHLD`→`SIG_IGN`.
- **Orphan**: parent died; child adopted by PID 1 (init reaps it).

## File Descriptors & I/O

- fd 0/1/2 = stdin/stdout/stderr; max per process via `ulimit -n`.
- **VFS**: everything is a "file" — `/dev`, `/proc`, `/sys`, pipes, sockets share read/write semantics.
- **mmap**: file/device into memory; `MAP_SHARED` writes back, `MAP_PRIVATE` copy-on-write.
- **sendfile / splice**: zero-copy transfers between fds.

## Signals (man 7 signal)

`SIGINT`(2), `SIGQUIT`(3), `SIGKILL`(9, uncatchable), `SIGTERM`(15), `SIGSTOP`(19, uncatchable), `SIGCONT`(18), `SIGHUP`(1), `SIGCHLD`. Only `SIGKILL` and `SIGSTOP` cannot be caught/blocked/ignored. Prefer `sigaction()` over `signal()`; only async-signal-safe functions (e.g. `write()`) are safe in handlers.

## Memory Management

- **Virtual memory**: 48-bit address space on x86_64; pages usually 4096 bytes (huge pages 2MB/1GB). See `/proc/meminfo`, `/proc/PID/maps`, `/proc/PID/smaps`.
- **malloc()**: user-space allocator (glibc ptmalloc); uses `brk`/`mmap` under the hood.
- **OOM killer**: selects a process by badness (`/proc/PID/oom_score`); adjust with `oom_score_adj` (-1000 = never kill).
- **Huge pages**: reduce TLB misses; THP can cause latency spikes in RT apps.

## IPC

Pipes (`pipe`/`mkfifo`), Unix domain sockets (`sockaddr_un`), shared memory (POSIX `shm_open`+`mmap` / SysV `shmget`), message queues, semaphores (`sem_wait`/`sem_post`).

## /proc & /sys

- **/proc**: runtime info — `/proc/[pid]/{status,maps,fd,cgroup}`, plus `cpuinfo`, `meminfo`, `loadavg`, `cmdline`, `swaps`.
- **/sys**: device/driver state (sysfs) — e.g. `/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor`, `/sys/class/backlight/.../brightness`.

## Tracing & Debugging

- **strace** — trace syscalls: `strace -p PID`, `strace -f`, `strace -e trace=open,read`, `strace -c`.
- **ltrace** — trace library calls.
- **perf** — sampling profiler: `perf stat`, `perf record/report`, `perf top`.
- **ftrace** — kernel function tracer via `/sys/kernel/tracing/` (or `trace-cmd`).
- **gdb** — userspace debugger: `gdb -p PID`, `gdb program core`.
- **valgrind** — memcheck/leaks (slows ~20x).

## Building a Kernel

```bash
make menuconfig          # ncurses config
make -j$(nproc)          # build
make modules_install
make install
# Debian: update-grub   |   Arch: grub-mkconfig -o /boot/grub/grub.cfg
```
