# Java Programming

## Core Features
- JVM-based, statically typed, object-oriented, garbage collected. "Write once, run anywhere." Compiled to bytecode → runs on JVM. Java 21 (LTS) current, Java 8 still widely used (LTS). Oracle JDK vs OpenJDK (Amazon Corretto, Adoptium Eclipse Temurin, Azul Zulu)
- JVM languages: Java, Kotlin (JetBrains, Android official), Scala (functional+OO), Groovy (scripting), Clojure (Lisp on JVM), JRuby, Jython

## Key Features (by version)
- Java 8 (2014): Lambdas, Streams API, Optional, new Date/Time API (java.time). The most important modern release
- Java 9 (2017): Modules (JPMS), JShell (REPL, interactive Java shell)
- Java 11 (2018 LTS): HTTP Client (java.net.http), local variable syntax for lambda parameters, Flight Recorder
- Java 14 (2020): Records (immutable data carriers, like Kotlin data class: `record Point(int x, int y) {}`). Pattern matching for instanceof
- Java 17 (2021 LTS): Sealed classes, pattern matching for switch (preview), strong encapsulation for JDK internals
- Java 21 (2023 LTS): Virtual threads (Project Loom - lightweight threads), record patterns, pattern matching switch (final), sequenced collections, string templates (preview)

## Syntax
```java
// Hello World
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}

// Records (Java 14+)
public record Person(String name, int age) {}

// Sealed classes (Java 17+)
public sealed class Shape permits Circle, Square, Triangle {}
public final class Circle extends Shape {}
public sealed class Square extends Shape permits ColoredSquare {}
// non-sealed: any subclass allowed

// Pattern matching switch (Java 21+)
String formatted = switch (obj) {
    case Integer i -> String.format("int %d", i);
    case String s when s.length() > 5 -> "Long string";
    case String s -> "Short string";
    case null -> "null";
    default -> "Unknown";
};
```

## Build Tools
- Maven: XML-based (pom.xml), conventions (src/main/java, src/test/java), lifecycle (compile → test → package → install → deploy). Central repository (Maven Central). Most widely used
- Gradle: Groovy/Kotlin DSL, faster than Maven (incremental compilation, build cache). Android standard. More flexible
- JAR: Java Archive (compiled .class files). WAR: Web Archive (for servlet containers). FAT JAR/uber-JAR: all dependencies bundled. Spring Boot executable JARs

## Frameworks
- Spring Boot: most popular. Auto-configuration, embedded Tomcat/Jetty/Undertow, starters (spring-boot-starter-web, spring-boot-starter-data-jpa). Dependency injection (@Autowired). REST APIs (@RestController, @RequestMapping). Actuator (health, metrics, env). Micrometer metrics integration with Prometheus, Datadog, JMX
- Jakarta EE (formerly Java EE): enterprise standard — Servlets, JPA, JMS, CDI, REST (JAX-RS). WildFly, Payara, Tomcat (servlet only)
- Hibernate: ORM (Object-Relational Mapping). JPA implementation. Maps Java objects to database tables. HIBERNATE: handles CRUD, lazy loading, caching
- JUnit 5: unit testing framework (@Test, @BeforeEach, assertions, parameterized tests, @Nested). Mockito: mocking framework

## Concurrency
- Thread: `new Thread(() -> { ... }).start()`. ExecutorService: thread pool (`Executors.newFixedThreadPool(4)`). Future: get result from async task
- Virtual threads (Java 21): `Thread.ofVirtual().start(() -> {...})`. Millions of lightweight threads, no thread pool needed. Great for I/O-bound apps (REST APIs, database calls). Not for CPU-bound
- CompletableFuture: async pipeline (thenApply, thenCompose, exceptionally, allOf). Non-blocking coordination
- Synchronized: intrinsic lock on object. Locks: ReentrantLock, ReadWriteLock. Atomics: AtomicInteger, AtomicReference. Concurrent collections: ConcurrentHashMap, CopyOnWriteArrayList
