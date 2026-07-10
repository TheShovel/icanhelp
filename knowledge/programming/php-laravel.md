# PHP & Laravel Basics

## PHP 8 Features
- JIT (Just-In-Time compilation): performance improvements for CPU-heavy workloads. Named arguments: `find(name: 'John', age: 30)`. Attributes (annotations): `#[Route('/api/users')]`. Match expression (replaces switch, returns value). Constructor property promotion: `public function __construct(public string $name) {}`. Union types: `int|string`. Nullsafe operator: `$user?->address?->city`. readonly properties, enums (native), fibers (concurrency)

## Laravel Framework
- MVC (Model-View-Controller). Eloquent ORM (ActiveRecord implementation). Blade templating engine (`@if`, `@foreach`, `@include`). Artisan CLI (scaffolding: `php artisan make:controller UserController --resource`). Migrations (version control for DB schema). Seeders + Factories (test data). Routing (`Route::get('/users', [UserController::class, 'index'])`). Middleware (auth, CSRF, throttle). Queues (Redis, DB, SQS — for async jobs). Broadcasting (WebSockets — Pusher, Laravel Reverb). Tinker (REPL). Caching (Redis, Memcached, file, database)
  - Key packages: Laravel Breeze (simple auth), Jetstream (team-based auth + Livewire/Inertia), Socialite (OAuth providers), Passport (OAuth2 server — token-based API auth), Sanctum (SPA + token-based auth, simpler than Passport, better for APIs + first-party + single page apps), Cashier (Stripe/Paddle subscriptions), Horizon (queue monitoring), Scout (Elasticsearch/Algolia search), Telescope (debugging dashboard), Nova (admin panel — paid, $199/site), Reverb (WebSocket server)

## PHP MVC Workflow
```php
// Route
Route::get('/users/{user}', [UserController::class, 'show']);

// Controller
class UserController extends Controller {
    public function show(User $user) {
        return view('users.show', compact('user'));
    }
}

// Model
class User extends Authenticatable {
    protected $fillable = ['name', 'email'];
    public function posts(): HasMany {
        return $this->hasMany(Post::class);
    }
}
```
