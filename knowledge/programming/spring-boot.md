# Spring Boot

Production-ready Java framework for building microservices and web applications.

## Core Concepts
- **Auto-configuration**: `@SpringBootApplication` = `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`. Spring Boot automatically configures beans based on classpath dependencies (e.g., H2 on classpath → DataSource auto-configured). Can override with explicit beans
- **Starters**: Pre-configured dependency sets — `spring-boot-starter-web` (REST + embedded Tomcat), `spring-boot-starter-data-jpa` (Hibernate + JPA), `spring-boot-starter-security` (authentication + authorization), `spring-boot-starter-test` (JUnit, Mockito, MockMvc)
- **Properties**: `application.properties` or `application.yml`. Environment-specific: `application-dev.properties`, `application-prod.properties`. Activated via `SPRING_PROFILES_ACTIVE=prod` or `spring.profiles.active`
- **Actuator**: Production monitoring — `/actuator/health`, `/actuator/metrics`, `/actuator/info`, `/actuator/env`. Enable via `spring-boot-starter-actuator`. Custom health indicators, metrics, info endpoints

## REST Controllers
- **`@RestController`**: `@Controller` + `@ResponseBody` — JSON/XML responses automatically. `@RequestMapping("/api/users")` at class level
- **Request mapping**: `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`. `@PathVariable("id") Long id` for path variables. `@RequestParam("page") int page` for query params. `@RequestBody User user` for request body
- **ResponseEntity**: Control HTTP status, headers, body — `ResponseEntity.ok(body)`, `ResponseEntity.created(uri).body(body)`, `ResponseEntity.notFound().build()`, `ResponseEntity.badRequest().body(error)`
- **Exception handling**: `@ControllerAdvice` — global exception handler. `@ExceptionHandler(ResourceNotFoundException.class)` — returns proper HTTP status. Custom error response DTO with timestamp, message, details

## Dependency Injection
- **Annotations**: `@Component` (generic), `@Service` (business logic), `@Repository` (data access — enables persistence exception translation), `@Controller` (web controller). `@Autowired` for injection (field, constructor, or setter)
- **Constructor injection**: Preferred — `public UserService(UserRepository repo) { this.repo = repo; }`. Makes dependencies explicit, enables immutability, easier testing
- **Scopes**: Singleton (default — one instance per Spring context), Prototype (new instance per injection), Request (per HTTP request), Session (per HTTP session). `@Scope("prototype")`
- **Profiles**: `@Profile("dev")` — activate beans only for specific profile. Database configuration different for dev (H2 in-memory) vs prod (PostgreSQL)

## JPA & Data Access
- **Spring Data JPA**: Repository interface — no implementation needed. `public interface UserRepository extends JpaRepository<User, Long> { List<User> findByLastName(String name); @Query("SELECT u FROM User u WHERE u.email = ?1") Optional<User> findByEmail(String email); }`
- **Entity**: `@Entity`, `@Table(name = "users")`, `@Id`, `@GeneratedValue(strategy = GenerationType.IDENTITY)`, `@Column(name = "email", unique = true, nullable = false)`. `@Transient` for fields not persisted
- **Relationships**: `@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`. Lazy loading vs eager. `JoinColumn`, `JoinTable`. Fetch strategies: LAZY (default for OneToMany), EAGER (default for ManyToOne)
- **Transactions**: `@Transactional` — on service layer. Rollback on runtime exceptions (not checked exceptions). Propagation: REQUIRED (default — join existing or create new), REQUIRES_NEW (suspend existing, create new), NESTED (savepoint). Isolation: READ_COMMITTED (default)
- **Migrations**: Flyway or Liquibase — version-controlled SQL scripts. `V1__create_users_table.sql`. Automatic execution on startup. Tracks applied migrations in flyway_schema_history table

## Security (Spring Security)
- **Security filter chain**: Configurable via `SecurityFilterChain` bean. Default: all endpoints require authentication, form login, CSRF protection
- **JWT authentication**: Stateless — `SecurityFilterChain` with `SessionCreationPolicy.STATELESS`. JWT filter extracts token, validates signature, sets SecurityContext. No session management
- **OAuth2 / OIDC**: Spring Security supports — `spring-boot-starter-oauth2-client`. Social login (Google, GitHub), resource server (JWT validation). Authorization server (Spring Authorization Server)
- **Method security**: `@PreAuthorize("hasRole('ADMIN')")` on methods. `@Secured`, `@RolesAllowed`. Enable with `@EnableMethodSecurity`
- **CORS**: `@CrossOrigin(origins = "http://localhost:4200")` on controller or global `CorsConfigurationSource` bean

## Testing
- **`@SpringBootTest`**: Full application context — integration tests. `@WebMvcTest` — slice test for controllers only. `@DataJpaTest` — JPA slice, H2 in-memory. `@MockBean` for replacing beans with mocks
- **MockMvc**: `mockMvc.perform(get("/api/users/1")).andExpect(status().isOk()).andExpect(jsonPath("$.name").value("John"))`. Tests controller + serialization without HTTP server
- **TestContainers**: Integration tests with real databases (PostgreSQL, MySQL) in Docker containers. `@Testcontainers`, `@Container`. More realistic than H2 for JPA tests
- **AssertJ**: Fluent assertions — `assertThat(result).isNotNull().extracting(User::getName).isEqualTo("John")`. Preferred over JUnit assertions

## Actuator & Metrics
- **Micrometer**: Vendor-neutral metrics facade. Metrics exposed to: Prometheus (`micrometer-registry-prometheus`), Graphite, Datadog, New Relic. Custom metrics: `@Autowired MeterRegistry` → `registry.counter("api.calls", "endpoint", "/users")`
- **Health indicators**: Custom `implements HealthIndicator` — check external service health (database, queue, cache). Returns UP/DOWN + details
- **Audit events**: `@AuditListener` captures authentication success/failure, method calls. Custom audit events extend `AbstractAuditEvent`

## Packaging & Deployment
- **Fat JAR**: Maven (`spring-boot-maven-plugin`) or Gradle — packages app + embedded Tomcat into single executable JAR. `java -jar app.jar`. External config: `--spring.config.location=file:./config/`
- **Docker**: Multi-stage build — Maven build in JDK image → copy JAR to slim JRE image. `docker build -t myapp .`. Spring Boot layered JAR (since 2.3): layers for dependencies, resources, application — efficient Docker layer caching
- **Cloud-native**: Spring Cloud — service discovery (Eureka), config server, circuit breaker (Resilience4j), API gateway (Spring Cloud Gateway), distributed tracing (Sleuth + Zipkin)
