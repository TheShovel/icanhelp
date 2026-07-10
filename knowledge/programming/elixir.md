# Elixir & Phoenix

Elixir is a dynamic, functional language built on the Erlang VM (BEAM) for fault-tolerant, concurrent systems.

## Key Concepts
- **Immutable data**: All values are immutable — returns new data instead of modifying in place
- **Pattern matching**: `=` is match operator — `[head | tail] = list`, `{:ok, value} = result`
- **Pipe operator**: `|>` passes result as first argument — `users |> Enum.filter(&active?/1) |> Enum.map(&name/1)`
- **Recursion over loops**: No traditional `for` — `Enum.reduce/3`, recursion with tail-call optimization
- **Atoms**: Constants where name is value — `:ok`, `:error`, `:not_found`
- **Tuples**: `{:ok, result}` or `{:error, reason}` — idiomatic for multi-return-values
- **Maps**: `%{key: value}` — atom keys shorthand, `map.key` access, `%{map | key: new_val}` for update
- **Structs**: Typed maps — `defstruct [:name, :age]` with compile-time field validation

## Concurrency (BEAM)
- **Processes**: Lightweight (1-2KB each), millions can run concurrently — no shared memory, message passing
- **`spawn(fn)`**: Creates a new process; `send(pid, msg)` and `receive do ... end` for messaging
- **GenServer**: Generic server behavior — `handle_call` (sync), `handle_cast` (async), `handle_info` (messages)
- **Supervision trees**: `Supervisor` restarts children per strategy (`:one_for_one`, `:one_for_all`, `:rest_for_one`)
- **OTP**: Open Telecom Platform — battle-tested patterns for building robust systems

## Phoenix Framework
- **MVC architecture**: `Router` → `Controller` → `Template` (HEEx); `contexts` for business logic
- **LiveView**: Real-time UI without JS — server-rendered over WebSocket, updates in ~1ms
- **HEEx**: HTML-aware templating with components, slots, dynamic attributes, `.heex` files
- **Ecto**: Database wrapper and query DSL — `Repo.all(from u in User, where: u.age > 18)`, migrations, schemas
- **Phoenix PubSub**: Distributed publish-subscribe — `Phoenix.PubSub.broadcast/3`, `subscribe/2`
- **Channels**: WebSocket abstraction — bidirectional communication with client via topics
- **Phoenix LiveView hooks**: Client-side JS integrations via `phx-hook` attribute

## Ecto Deep
- **Schemas**: `schema "users" do field :name, :string; timestamps() end` — maps DB to Elixir structs
- **Changesets**: `User.changeset(%User{}, params)` — cast, validate, constrain before DB operations
- **Associations**: `belongs_to`, `has_many`, `has_one`, `many_to_many` — preload eagerly or via joins
- **Migrations**: `def change do create table(:posts) do ... end end` — reversible by default

## Performance Characteristics
- **Soft real-time**: GC is per-process — no stop-the-world pauses, predictable latency
- **Linear scalability**: Add cores = more throughput — BEAM uses one scheduler per CPU core
- **Fault tolerance**: "Let it crash" philosophy — supervisors restart failed components
- **NIFs**: Native Implemented Functions for C code — fast but can crash VM if not careful

## Tooling
- **Mix**: Build tool — `mix new`, `mix phx.new`, `mix test`, `mix format`, `mix run`
- **IEx**: Interactive REPL with tab completion, docs, debugging
- **ExUnit**: Built-in test framework — `describe`, `test`, `assert`, `assert_raise`
- **Dialyzer**: Static analysis for type discrepancies and dead code
- **Config**: `config/config.exs` with environment-specific overrides in `config/dev.exs`, `config/prod.exs`
