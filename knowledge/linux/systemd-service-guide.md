<!DOCTYPE refentry PUBLIC "-//OASIS//DTD DocBook XML V4.5//EN"
  "http://www.oasis-open.org/docbook/xml/4.5/docbookx.dtd">
  
    systemd.service
    systemd
  
  
    systemd.service
    5
  
  
    systemd.service
    Service unit configuration
  
  
    service.service
  
  
    Description
    A unit configuration file whose name ends in
    .service encodes information about a process
    controlled and supervised by systemd.
    This man page lists the configuration options specific to
    this unit type. See
    systemd.unit5
    for the common options of all unit configuration files. The common
    configuration items are configured in the generic
    [Unit] and [Install]
    sections. The service specific configuration options are
    configured in the [Service] section.
    Additional options are listed in
    systemd.exec5,
    which define the execution environment the commands are executed
    in, and in
    systemd.kill5,
    which define the way the processes of the service are terminated,
    and in
    systemd.resource-control5,
    which configure resource control settings for the processes of the
    service.
    The systemd-run1
    command allows creating .service and .scope units dynamically
    and transiently from the command line.
  
  
    Service Templates
    It is possible for systemd services to take a single argument via the
    service@argument.service
    syntax. Such services are called "instantiated" services, while the unit definition without the
    argument parameter is called a "template". An example could be a
    dhcpcd@.service service template which takes a network interface as a
    parameter to form an instantiated service. Within the service file, this parameter or "instance
    name" can be accessed with %-specifiers. See
    systemd.unit5
    for details.
  
  
    Automatic Dependencies
    
      Implicit Dependencies
      The following dependencies are implicitly added:
      
        Services with Type=dbus set automatically
        acquire dependencies of type Requires= and
        After= on
        dbus.socket.
        Socket activated services are automatically ordered after
        their activating .socket units via an
        automatic After= dependency.
        Services also pull in all .socket units
        listed in Sockets= via automatic
        Wants= and After= dependencies.
      
      Additional implicit dependencies may be added as result of
      execution and resource control parameters as documented in
      systemd.exec5
      and
      systemd.resource-control5.
    
    
      Default Dependencies
      The following dependencies are added unless DefaultDependencies=no is set:
      
        Service units will have dependencies of type Requires= and
        After= on sysinit.target, a dependency of type After= on
        basic.target as well as dependencies of type Conflicts= and
        Before= on shutdown.target. These ensure that normal service units pull in
        basic system initialization, and are terminated cleanly prior to system shutdown. Only services involved with early
        boot or late system shutdown should disable this option.
        Instanced service units (i.e. service units with an @ in their name) are assigned by
        default a per-template slice unit (see
        systemd.slice5), named after the
        template unit, containing all instances of the specific template. This slice is normally stopped at shutdown,
        together with all template instances. If that is not desired, set DefaultDependencies=no in the
        template unit, and either define your own per-template slice unit file that also sets
        DefaultDependencies=no, or set Slice=system.slice (or another suitable slice)
        in the template unit. Also see
        systemd.resource-control5.
        
      
    
  
  
    Options
    Service unit files may include [Unit] and [Install] sections, which are described in
    systemd.unit5.
    
    Service unit files must include a [Service]
    section, which carries information about the service and the
    process it supervises. A number of options that may be used in
    this section are shared with other unit types. These options are
    documented in
    systemd.exec5,
    systemd.kill5
    and
    systemd.resource-control5.
    The options specific to the [Service] section
    of service units are the following:
    
      
        Type=
        
          Configures the mechanism via which the service notifies the manager that the service start-up
          has finished. One of simple, exec, forking,
          oneshot, dbus, notify,
          notify-reload, or idle:
          
            If set to simple (the default if ExecStart=
            is specified but neither Type= nor BusName= are, and
            credentials are not used), the service manager will consider the unit started immediately after
            the main service process has been forked off (i.e. immediately after fork(),
            and before various process attributes have been configured and in particular before the new process
            has called execve() to invoke the actual service binary). Typically,
            Type=exec is the better choice, see below.
            It is expected that the process configured with ExecStart= is the main
            process of the service. In this mode, if the process offers functionality to other processes on
            the system, its communication channels should be installed before the service is started up
            (e.g. sockets set up by systemd, via socket activation), as the service manager will immediately
            proceed starting follow-up units, right after creating the main service process, and before
            executing the service's binary. Note that this means systemctl start command
            lines for simple services will report success even if the service's binary
            cannot be invoked successfully (for example because the selected User= does not
            exist, or the service binary is missing).
            The exec type is similar to simple, but the
            service manager will consider the unit started immediately after the main service binary has been
            executed. The service manager will delay starting of follow-up units until that point. (Or in
            other words: simple proceeds with further jobs right after
            fork() returns, while exec will not proceed before both
            fork() and execve() in the service process succeeded.)
            Note that this means systemctl start command lines for exec
            services will report failure when the service's binary cannot be invoked successfully (for
            example because the selected User= does not exist, or the service binary is
            missing). This type is implied if credentials are used (refer to LoadCredential=
            in systemd.exec5
            for details).
            If set to forking, the manager will consider the unit started
            immediately after the binary that forked off by the manager exits. The use of this type
            is discouraged, use notify, notify-reload, or
            dbus instead.
            It is expected that the process configured with ExecStart= will call
            fork() as part of its start-up. The parent process is expected to exit when
            start-up is complete and all communication channels are set up. The child continues to run as the
            main service process, and the service manager will consider the unit started when the parent
            process exits. This is the behavior of traditional UNIX services. If this setting is used, it is
            recommended to also use the PIDFile= option, so that systemd can reliably
            identify the main process of the service. The manager will proceed with starting follow-up units
            after the parent process exits.
            Behavior of oneshot is similar to exec;
            however, the service manager will consider the unit up after the main process exits. It will then
            start follow-up units. RemainAfterExit= is particularly useful for this type
            of service. Type=oneshot is the implied default if neither
            Type= nor ExecStart= are specified. Note that if this
            option is used without RemainAfterExit= the service will never enter
            active unit state, but will directly transition from
            activating to deactivating or dead,
            since no process is configured that shall run continuously. In particular this means that after a
            service of this type ran (and which has RemainAfterExit= not set) it will not
            show up as started afterwards, but as dead.
            Behavior of dbus is similar to simple; however,
            units of this type must have the BusName= specified and the service manager
            will consider the unit up when the specified bus name has been acquired. This type is the default
            if BusName= is specified.
            Service units with this option configured implicitly gain dependencies on the
            dbus.socket unit. A service unit of this type is considered to be in the
            activating state until the specified bus name is acquired. It is considered activated while the
            bus name is taken. Once the bus name is released the service is considered being no longer
            functional which has the effect that the service manager attempts to terminate any remaining
            processes belonging to the service. Services that drop their bus name as part of their shutdown
            logic thus should be prepared to receive a SIGTERM (or whichever signal is
            configured in KillSignal=) as result.
            Behavior of notify is similar to exec; however,
            it is expected that the service sends a READY=1 notification message via
            sd_notify3 or
            an equivalent call when it has finished starting up. systemd will proceed with starting follow-up
            units after this notification message has been sent. If this option is used,
            NotifyAccess= (see below) should be set to open access to the notification
            socket provided by systemd. If NotifyAccess= is missing or set to
            none, it will be forcibly set to main.
            If the service supports reloading, and uses a signal to start the reload, using
            notify-reload instead is recommended.
