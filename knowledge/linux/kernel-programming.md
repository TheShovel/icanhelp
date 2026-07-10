# GNU/Linux Kernel & System Programming

## Kernel Architecture
- **Monolithic** (Linux): whole kernel runs in kernel space as single binary — high performance (fast system calls, direct memory access), but any driver bug crashes entire system. Compare to microkernel (minimal kernel, drivers in user space — more stable, slower)
- **User space vs kernel space**: kernel space = ring 0 (full hardware access, crashes = panic). User space = ring 3 (limited, crashes = just that process dies). Transition via system calls (syscalls — about 400 on Linux, defined in /usr/include/asm/unistd_64.h on modern systems)
  - Kernel protects memory: user space can't read/write kernel memory. Kernel can read/write user space only via copy_from_user/copy_to_user (special functions, security check)
- **Linux kernel versioning**: 6.x (since 2022 — LTS releases every 2 years, supported 6 years). Formerly: 2.6.x (2003-2011), 3.x (2011-2015), 4.x (2015-2022). Check: uname -r
- **Loadable kernel modules**: .ko files in /lib/modules/$(uname -r)/. Insert: insmod/ modprobe (with dep handling). Remove: rmmod. List: lsmod. Info: modinfo. Module parameters: modprobe mod_name param=value

## System Calls
```c
// Common syscalls (man 2 section)
open(), close(), read(), write()         // file I/O
stat(), fstat(), lstat()                 // file info
mmap(), munmap()                         // memory mapping (efficient I/O)
fork(), execve(), wait(), exit()         // process management
socket(), bind(), listen(), accept()     // networking
ioctl()                                  // device control
fcntl()                                  // file control (non-blocking flags etc.)
select(), poll(), epoll()                // I/O multiplexing (epoll most scalable)
```

## Linux Process Model
- **fork()**: creates child process as nearly exact copy of parent (copy-on-write memory using COW page table — pages shared until either writes, then copied). Returns 0 in child, child PID in parent
- **exec() family**: replaces current process with new program — execl, execlp, execle, exect, execlp, execv, execvp, execvpe. All exec call same syscall execve
```c
pid_t pid = fork();
if (pid == 0) {
    // child
    execlp("/bin/ls", "ls", "-l", NULL);
    exit(1); // only reached if exec fails
} else if (pid > 0) {
    // parent
    wait(NULL); // wait for child to finish
}
```
- **Zombie process**: child done, parent hasn't called wait(). Show as "Z" in ps. Parent must call wait()/waitpid() to reap. Or: signal handler for SIGCHLD > set to SIG_IGN = auto reaping. If parent never calls wait = zombie forever (until parent exits)
- **Orphan process**: parent dies first — child adopted by init (PID 1). Init automatically reaps. Process group orphaned: kernel sends SIGHUP then SIGCONT, usually kill

## File Descriptors & I/O
- **File descriptor**: small integer (0 = stdin, 1 = stdout, 2 = stderr). Max per process: ulimit -n (default 1024, can raise). Each process inherits open fds from parent
- **VFS (Virtual File System)**: everything is a file in Unix — regular files, devices (/dev), processes (/proc), kernel info (/sys), pipes, sockets — all accessed through same read/write interface
- **read/write**: blocking by default. Non-blocking: set O_NONBLOCK on open or fcntl. read returns -1 with EAGAIN if no data
- **mmap**: maps file or device into memory — faster random access than read/write. Flags: MAP_SHARED (changes written back to file), MAP_PRIVATE (copy-on-write). Used by: file I/O, shared memory IPC, executable loading
- **sendfile**: zero-copy data transfer between file descriptors (server → client file without copying through user space). Used by web servers, file transfer apps
- **splice**: zero-copy between two file descriptors (pipes)

## Signals
- List: man 7 signal. Common: SIGINT (2, Ctrl+C), SIGQUIT (3, Ctrl+\), SIGKILL (9, cannot be caught/ignored), SIGTERM (15, polite quit), SIGSTOP (19, stop, cannot be caught), SIGCONT (18, continue), SIGHUP (1, hangup/reload). SIGCHLD (child exit). SIGUSR1/SIGUSR2 (10/12, user-defined)
  - SIGKILL and SIGSTOP: only two signals that can't be caught, blocked, or ignored
- Default behavior: most = terminate. SIGQUIT = terminate + core dump. SIGSTOP/SIGTSTP = stop. SIGCONT = continue if stopped
- Setting handlers: signal() (simple, varies by Unix). sigaction() (POSIX, preferred, more control — specify flags, sa_mask, old handlder). Restarting system calls: SA_RESTART flag for interrupted I/O
```c
struct sigaction sa = { .sa_handler = my_handler, .sa_flags = SA_RESTART };
sigaction(SIGINT, &sa, NULL);
```
- Signal safety: only async-signal-safe functions can be called from signal handlers (write(), not printf(), malloc(), etc. Safer: set volatile sig_atomic_t flag in handler, check in main loop). Write to self-pipe trick: write byte to pipe in handler, main loop reads pipe

## Memory Management
- **Virtual memory**: each process gets 48-bit virtual address space (on x86_64). Kernel maps virtual → physical via page tables (MMU does translation). Pages = 4096 bytes typically (huge pages = 2MB or 1GB for large apps/database). Swapping: LRU pages evicted to swap when under memory pressure
  - /proc/meminfo shows: MemTotal, MemAvailable, Buffers, Cached, SwapTotal, SwapFree
  - /proc/PID/maps: each mapped region (stack, heap, libraries, executable). /proc/PID/smaps: details per mapping
- **malloc()**: user-space heap allocator (glibc ptmalloc), not system call. brk()/sbrk() (heap growth) or mmap (large allocations, >128KB). Free memory not returned to kernel — stays in pool for future mallocs. Use malloc_trim() to force release
- **OOM killer**: Out-Of-Memory manager — when system runs out of memory, kernel selects and kills a process (badness score: /proc/PID/oom_score, higher = more likely to be chosen). Adjust: echo -1000 > /proc/PID/oom_score_adj (never kill) or echo 1000 (always kill first)
- **Huge pages**: 2MB pages reduce TLB misses — for large memory applications (databases, VMs). Transparent Huge Pages (THP) = automatic, can cause latency spikes in real-time apps. Explicit: hugetlbfs

## IPC (Inter-Process Communication)
- **Pipes**: unidirectional (fd[0] read, fd[1] write). pipe() syscall. Used between parent-child (fork). Named pipe/FIFO: mkfifo, for unrelated processes
- **FIFO (named pipe)**: persists as file in filesystem (mkfifo). Processes open like file. Unrelated processes communicate. Blocking by default: open() reads blocks until writer opens. Use O_NONBLOCK
- **Unix domain sockets**: SOCK_STREAM (like TCP) or SOCK_DGRAM (like UDP). Faster than TCP (no network stack). bind to path (sockaddr_un). Used by: X11, syslog, dbus, systemd-journald. abstract namespace: sun_path starts with \0 (no filesystem entry)
- **Shared memory**: POSIX (shm_open + mmap) or System V (shmget/shmat). Fastest IPC. Need synchronization (mutex/ semaphore). Used by: databases, multimedia, scientific computing
- **Message queues**: POSIX (mq_open) or System V (msgget). Structured messages. Less common now (people use sockets or shared memory)
- **Semaphores**: POSIX (sem_open, named) or System V (semget). For synchronizing access to shared resources. sem_wait (P, decrement) and sem_post (V, increment)

## /proc & /sys Filesystems
- **/proc**: runtime kernel info — /proc/[pid]/ (status, maps, environ, fd, cwd, exe, limits, io, net/tcp, net/udp). /proc/cpuinfo, meminfo, uptime, loadavg, diskstats, mounts, swaps, version, cmdline (kernel boot parameters)
- **/sys**: device + driver info (sysfs) — /sys/block, /sys/class, /sys/devices, /sys/power, /sys/kernel. Exposes kernel data structures as files. Write to control: /sys/class/backlight/.../brightness, /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

## Tracing & Debugging
- **strace**: trace system calls — strace -p PID (attach), strace -f (follow forks), strace -e trace=open,read (filter), strace -c (summary statistics count). Invaluable: find what a program does, why fails, where time goes
- **ltrace**: trace library calls
- **perf**: Linux profiler = sampling CPU + hardware counters. perf stat (count events), perf record/report (profile), perf top (live). perf_events subsystem: count cycles, instructions, cache misses, branch mispredicts
- **ftrace**: kernel function tracer (tracepoints — built into kernel). /sys/kernel/tracing/ — echo function > current_tracer and watch trace file. Also: trace-cmd command wraps it
- **eBPF**: in-kernel virtual machine — run sandboxed programs in kernel for networking, security, tracing. Tools: bpftrace (one-liners like DTrace), BCC (Python library for BPF programs). Used by: Cilium (networking), Falco (security), Pixie (observability), Netflix (performance). The future of kernel observability
- **gdb**: userspace debugger. Debug: gdb program (run, break, next, print, backtrace). Attach to running: gdb -p PID. Debug child: set follow-fork-mode child. Core dump: gdb program core
- **valgrind**: memory debugging (memcheck = detects leaks, use-after-free), cache profiling (cachegrind), heap profiling (massif), threading error (helgrind/drd). Slows program ~20x

## Kernel Configuration
- **sysctl**: runtime kernel parameter adjustment — sysctl -a (list all), sysctl net.ipv4.ip_forward=1 (set). Persistent: /etc/sysctl.conf or /etc/sysctl.d/*.conf
- **Kernel command line**: GRUB — quiet splash (quiet messages), nomodeset (basic video), acpi=off (troubleshoot), systemd.unit=emergency.target (boot to minimal shell), init=/bin/bash (direct shell). Single=1 (single-user mode). noibrs noibpb nopti (turn off mitigations for performance — security tradeoff)
- **Building kernel**: make menuconfig (ncurses), make -j$(nproc), make modules_install, make install. Update GRUB: update-grub (Debian) or grub-mkconfig -o /boot/grub/grub.cfg. Clean old kernels: remove /boot/vmlinuz-*, /boot/initrd.img-*, /lib/modules/*, update-grub
