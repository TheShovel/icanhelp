# Kotlin

Kotlin is a statically typed JVM language that also compiles to JS and native (LLVM).

## Key Features
- **Null safety**: Types are non-null by default. `String?` allows null. Safe call `?.`, Elvis `?:`, non-null assertion `!!`
- **Data classes**: `data class User(val name: String, val age: Int)` — auto-generates `equals()`, `hashCode()`, `toString()`, `copy()`
- **Extension functions**: `fun String.isEmail(): Boolean = contains("@")` — add methods to existing classes
- **Coroutines**: Lightweight threads — `suspend` functions, `launch`, `async/await` via `Deferred`
- **Smart casts**: After `is` check, compiler auto-casts: `if (x is String) x.length`
- **Sealed classes**: `sealed class Result` — restricted hierarchy, exhaustive when branches
- **Companion objects**: Static-like members: `companion object { val TAG = "..." }`
- **Higher-order functions**: Functions as first-class: `list.filter { it > 0 }.map { it * 2 }`

## Coroutines Deep
- **Dispatchers**: `Dispatchers.IO` (network/disk), `Dispatchers.Default` (CPU), `Dispatchers.Main` (UI thread)
- **Structured concurrency**: Coroutines are launched in a `CoroutineScope` — child coroutines complete before parent
- **Flow**: Cold async stream — `flow { emit(value) }`, terminal operators `collect`, `toList`, operators `map`, `filter`, `catch`
- **Channels**: Hot streams — `Channel<T>()`, `send()` / `receive()`, rendezvous (default) vs buffered
- **StateFlow/SharedFlow**: Hot flows for state observation — `StateFlow` always has current value

## Android Development
- **Jetpack Compose**: Declarative UI framework — `@Composable` functions, `remember`, `LaunchedEffect`
- **ViewModel**: `class MyViewModel : ViewModel()` — survives configuration changes, exposes `StateFlow`
- **Navigation**: `NavHost` with `composable("route/{param}")` — type-safe nav args in Compose
- **Room**: SQLite ORM — `@Entity`, `@Dao`, `@Database`, compile-time query verification
- **Retrofit + OkHttp**: Type-safe HTTP client — `interface Api { @GET("users") suspend fun getUsers(): List<User> }`
- **Hilt/Dagger**: Dependency injection — `@HiltViewModel`, `@Inject`, `@Module` for providing dependencies

## Multiplatform
- **KMP (Kotlin Multiplatform)**: Share business logic across Android, iOS, Web, Desktop
- **KMM (Multiplatform Mobile)**: Shared module targets Android + iOS via Kotlin/Native
- **Compose Multiplatform**: Jetpack Compose UI running on desktop (macOS, Windows, Linux) and web

## Tooling
- **Gradle**: Primary build system — `build.gradle.kts` with Kotlin DSL is standard
- **kapt** (annotation processing) → **KSP** (Kotlin Symbol Processing, faster) for compile-time code gen
- **kotlinx.serialization**: `@Serializable` annotation for JSON/protobuf/CBOR serialization
- **ktlint / detekt**: Linting and static analysis
- **Ktor**: Async HTTP client/server framework built on coroutines

## Interop
- **Java interop**: Call Java code directly from Kotlin, annotate with `@JvmStatic`, `@JvmOverloads` as needed
- **JavaScript interop**: `@JsName`, `external` declarations for JS libraries
- **Native interop**: `@CName`, `cinterop` tool for calling C libraries
