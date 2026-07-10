# Dart & Flutter

Dart is a client-optimized language; Flutter is a cross-platform UI framework using Dart.

## Dart Language
- **Sound null safety**: Types non-null by default, `?` for nullable, `late` for deferred initialization
- **Records**: `(String, int) record = ('Alice', 30)` — positional or named fields
- **Pattern matching**: `switch (value) { case (int a, int b): ... case String s: ... }` — destructuring + type checking
- **Extension methods**: `extension on String { int parseInt() => int.parse(this); }`
- **Async/await**: Future-based — `Future<T>`, `Stream<T>`, `async/await`, `await for` for streams
- **Isolates**: Separate memory threads — `Isolate.spawn()` for parallel computation (no shared state)
- **Mixins**: `mixin Flyable { void fly() => ... }` — class `Bird with Flyable` for code reuse without inheritance

## Flutter Widgets
- **Everything is a Widget**: `StatelessWidget` vs `StatefulWidget` — build methods return widget trees
- **`MaterialApp`**: Material Design wrapper — routes, themes, localization built-in
- **`Scaffold`**: App bar, body, drawer, bottom nav, FAB — standard page layout
- **`Container`**: Box with padding, margin, decoration, constraints, transform
- **`Row` / `Column`**: Flex layouts — `mainAxisAlignment`, `crossAxisAlignment`, `Expanded`, `Flexible`
- **`Stack`**: Overlapping children — `Positioned` widget for absolute positioning
- **`ListView`**: Scrollable list — `ListView.builder()` for large lists (lazy), `ListView.separated`
- **`GridView`**: Grid layout — `GridView.count()`, `GridView.extent()`, `GridView.builder()`
- **`CustomScrollView`**: Advanced scroll effects — `SliverAppBar`, `SliverList`, `SliverGrid`

## State Management
- **setState()**: Simplest — call in StatefulWidget, triggers rebuild
- **Provider**: `ChangeNotifierProvider` — `context.watch<Model>()`, `context.read<Model>()`
- **Riverpod**: Compile-safe, no BuildContext needed — `StateNotifierProvider`, `FutureProvider`
- **Bloc/Cubit**: Event-driven — `BlocProvider`, `BlocBuilder`, `BlocListener`
- **GetX**: Minimal boilerplate — reactive state, dependency injection, route management
- **ValueNotifier / ChangeNotifier**: Flutter built-in — `ListenableBuilder` for targeted rebuilds

## Navigation
- **Navigator 2.0**: Declarative — `Router`, `RouteInformationParser`, `RouterDelegate` for web/deep links
- **GoRouter**: Popular declarative router — `GoRouter(routes: [...])`, `context.go('/path')`, `context.push('/detail?id=1')`
- **Named routes**: `MaterialApp(routes: { '/home': (_) => HomePage() })` — simple but less flexible

## Performance
- **60/120 FPS**: Flutter renders at display refresh rate via Skia/Impeller graphics engine
- **Widget rebuild optimization**: `const` constructors prevent rebuilds; `RepaintBoundary` isolates repaint regions
- **Image caching**: `cached_network_image` package for efficient image loading
- **`DevTools`**: Timeline, memory, network profilers built into Flutter tooling

## Platforms
- **Same codebase**: iOS, Android, Web, Windows, macOS, Linux, embedded (Raspberry Pi)
- **Platform channels**: Call native code (Java/Kotlin for Android, Swift/ObjC for iOS, C++ for desktop) via `MethodChannel`
- **FFI**: Dart native interop for C libraries — `dart:ffi` for high-performance native calls
