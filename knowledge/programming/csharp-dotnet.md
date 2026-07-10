# C# / .NET

## .NET Runtime

Cross-platform runtime by Microsoft. Two main implementations:

- **.NET** (formerly .NET Core): open-source, cross-platform (Linux, macOS, Windows). Version 6+ LTS: 6, 8, 10 (LTS). Non-LTS: 7, 9.
- **.NET Framework**: Windows-only, legacy. ~4.8.1 final version. Migrate to .NET 8+ for new projects.

Runtime components: **CLR** (Common Language Runtime — JIT/AOT, GC, security), **BCL** (Base Class Library), **FCL** (Framework Class Library). JIT compiles IL to native on start; AOT via `NativeAOT` produces single-file native binaries.

## Project Structure

```bash
dotnet new console -n MyApp     # console
dotnet new webapi -n MyApi      # ASP.NET Core Web API
dotnet new classlib -n MyLib    # class library
dotnet new sln -n MySolution    # solution file
dotnet sln add src/*/            # add projects to solution
```

- Solution (`.sln`) groups one or more projects (`.csproj`)
- `.csproj` is MSBuild XML — SDK-style: `<Project Sdk="Microsoft.NET.Sdk.Web">`
- Top-level statements hide `Main` wrapper (one per project)

## C# Features

### Records

Immutable reference type with value-based equality:

```csharp
public record User(string Name, string Email);
var u1 = new User("Alice", "a@b.com");
var u2 = u1 with { Name = "Bob" }; // non-destructive mutation
Console.WriteLine(u1 == u2);        // false (value equality)

// Record struct (value type)
public readonly record struct Point(int X, int Y);
```

- `with` expression creates a copy with modified properties
- `Deconstruct` auto-generated: `var (name, email) = user;`
- `ToString()` prints all properties
- Classes: reference equality. Records: value equality by default.

### Pattern Matching

```csharp
switch (value) {
    case int i when i > 0: break;
    case string s: break;
    case null: break;
}

// Switch expression
var result = value switch {
    > 0 => "positive",
    < 0 => "negative",
    _ => "zero",
};

// Property matching
if (user is { Name: "Alice", Age: >= 18 }) { }

// List patterns (.NET 8+)
int[] nums = { 1, 2, 3 };
if (nums is [1, .., 3]) { }
```

- `is` pattern: type + condition check in one
- `or`, `and`, `not` patterns
- Discard `_` in deconstruction and patterns

### LINQ (Language Integrated Query)

```csharp
var query = users.Where(u => u.Age > 18)
                 .OrderBy(u => u.Name)
                 .Select(u => new { u.Name, u.Email })
                 .Take(10)
                 .ToList();

// Query syntax (compiles to method chain)
var result = from u in users
             where u.Age > 18
             orderby u.Name
             select u.Name;

// Group / Join
var grouped = users.GroupBy(u => u.Department);
var joined = from u in users join d in depts on u.DeptId equals d.Id select new { u.Name, d.Name };
```

- Deferred execution: `Where`, `Select`, `OrderBy` — execute on enumeration
- Immediate: `ToList()`, `ToArray()`, `Count()`, `First()`, `Any()`, `All()`
- LINQ to SQL: Entity Framework translates LINQ to SQL queries

### Async / Await

```csharp
public async Task<User> GetUserAsync(int id)
{
    using var http = new HttpClient();
    var json = await http.GetStringAsync($"https://api.example.com/users/{id}");
    return JsonSerializer.Deserialize<User>(json);
}

// Fire-and-forget (careful — unobserved exceptions)
_ = DoSomethingAsync();
```

- `Task` / `Task<T>`: awaitable types
- `ValueTask<T>`: avoids allocation for sync-completing operations
- `ConfigureAwait(false)`: don't capture synchronization context (library code)
- `async void` only for event handlers — top-level async `Main` allowed (returns `Task`)
- `Task.WhenAll(tasks)`, `Task.WhenAny(tasks)`, `Task.Delay(ms)`

### Top-Level Statements & Other Modern Features

```csharp
// Program.cs (one file only)
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.MapGet("/", () => "Hello World");
app.Run();
```

- **Native integers**: `nint`, `nuint` (IntPtr-sized)
- **Raw string literals**: `"""..."""` — no escaping
- **Required members**: `required string Name { get; set; }`
- **Primary constructors**: `public class User(string name) { }`
- **Collection expressions**: `int[] arr = [1, 2, 3];`
- **Inline arrays**: fixed-size stack arrays
- **Interceptors**: source generation hook

## ASP.NET Core — Minimal APIs

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/users/{id}", async (int id, AppDbContext db) =>
    await db.Users.FindAsync(id) is User u ? Results.Ok(u) : Results.NotFound());

app.MapPost("/users", async (User user, AppDbContext db) =>
{
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Created($"/users/{user.Id}", user);
});

app.MapDelete("/users/{id}", async (int id, AppDbContext db) =>
{
    var rows = await db.Users.Where(u => u.Id == id).ExecuteDeleteAsync();
    return rows > 0 ? Results.NoContent() : Results.NotFound();
});

app.Run();
```

- `Results.Ok()`, `Results.NotFound()`, `Results.Created()`, `Results.NoContent()`, `Results.BadRequest()`
- Filters: `app.MapGet("/users", [Authorize] async (HttpContext ctx) => ...)`
- Route groups: `var users = app.MapGroup("/users").RequireAuthorization();`
- Typed results: `Results.Ok<List<User>>(users)`
- Rate limiting, CORS, caching built-in

## Dependency Injection (DI)

Built-in container (no third-party container needed):

```csharp
// Registration
builder.Services.AddScoped<IUserService, UserService>();  // per request
builder.Services.AddSingleton<ICache, MemoryCache>();      // single instance
builder.Services.AddTransient<ILogger, Logger>();          // new each injection

// Injection (constructor)
public class UserService(IUserRepository repo, ILogger<UserService> logger) { }

// In minimal API (direct injection)
app.MapGet("/users", (IUserService svc) => svc.GetAll());

// Named/Keyed services (.NET 8+)
builder.Services.AddKeyedSingleton<ICache>("redis", (sp, key) => new RedisCache());
```

- Lifetimes: `Singleton` (one instance), `Scoped` (per HTTP request), `Transient` (every injection)
- `IServiceProvider` for manual resolution
- `ValidateOnBuild`: detect missing registrations at startup

## Entity Framework Core (EF Core)

### DbContext & Entity

```csharp
public class AppDbContext : DbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Post> Posts => Set<Post>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e => {
            e.ToTable("users");
            e.HasKey(u => u.Id);
            e.Property(u => u.Email).HasMaxLength(256);
            e.HasIndex(u => u.Email).IsUnique();
        });
    }
}

public class User {
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public List<Post> Posts { get; set; } = new();
}
```

### CRUD

```csharp
// Create
db.Users.Add(new User { Name = "Alice", Email = "a@b.com" });
await db.SaveChangesAsync();

// Read
var user = await db.Users.FindAsync(42);                    // primary key
var users = await db.Users.Where(u => u.Name.StartsWith("A"))
                          .OrderBy(u => u.Name)
                          .Include(u => u.Posts)            // eager loading
                          .Take(10)
                          .ToListAsync();

// Update
db.Users.Update(user);  // or attach and set state
await db.SaveChangesAsync();

// Delete
db.Users.Remove(user);
await db.SaveChangesAsync();

// Raw SQL
var users = await db.Users.FromSqlRaw("SELECT * FROM users WHERE age > {0}", 18).ToListAsync();
await db.Database.ExecuteSqlRawAsync("DELETE FROM users WHERE id = {0}", id);
```

### Migrations

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet ef migrations remove          # revert last migration (not applied)
dotnet ef database update LastGood   # rollback to specific migration
```

- `dotnet ef migrations script` — generate SQL script
- EF Core tools: `dotnet-ef` (install: `dotnet tool install --global dotnet-ef`)

## NuGet Packages

Package manager for .NET:

```bash
dotnet add package Newtonsoft.Json
dotnet add package Dapper --version 2.1.0
dotnet remove package Newtonsoft.Json
```

- NuGet.org: official package registry (250k+ packages)
- Common packages: `Dapper` (micro-ORM), `AutoMapper`, `Serilog` (logging), `FluentValidation`, `MediatR` (CQRS), `Refit` (typed HTTP clients), `Polly` (resilience/retry)
- `dotnet list package` — show installed with versions
- `nuget.config` — custom package sources (proxies, private feeds)

## Testing

```csharp
// xUnit
public class UserServiceTests
{
    [Fact]
    public void CreateUser_ValidEmail_Succeeds() { ... }

    [Theory]
    [InlineData("a@b.com", true)]
    [InlineData("invalid", false)]
    public void ValidateEmail(string email, bool expected) { ... }
}
```

```bash
dotnet test
dotnet test --filter "Category=Unit" --collect:"XPlat Code Coverage"
```

- Frameworks: xUnit (recommended), NUnit, MSTest
- Moq / NSubstitute: mocking
- Testcontainers: integration tests with Docker
- `WebApplicationFactory`: integration tests for ASP.NET Core

## Performance & AOT

- **NativeAOT**: compile to single native binary (no JIT). Startup < 10ms, memory ~5 MB
- **AOT limitations**: no runtime code gen, limited reflection, no `DynamicMethod`
- **Source generators**: compile-time code gen (instead of runtime reflection)
- **Span<T> / ReadOnlySpan<T>**: stack-allocated, ref-safe, zero-allocation slicing
- **`System.Text.Json`**: built-in, fast. `JsonSerializer` over `Newtonsoft.Json` in new code.
- **`DateOnly` / `TimeOnly`**: date/time types without offset (introduced .NET 6)
- **`Index` / `Range`**: slicing syntax: `arr[^3..]` last 3 elements, `arr[1..3]`

## Useful CLI Commands

```bash
dotnet --list-sdks                # SDK versions
dotnet --list-runtimes            # runtime versions
dotnet new list                   # template list
dotnet build -c Release           # build
dotnet publish -c Release -o ./out  # self-contained publish
dotnet pack                       # create NuGet package
dotnet run --project src/Web      # run specific project
```
