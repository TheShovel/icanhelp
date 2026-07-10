# Haskell

Haskell is a purely functional, statically typed programming language with lazy evaluation.

## Core Concepts
- **Purity**: Functions have no side effects — same input always produces same output
- **Lazy evaluation**: Expressions evaluated only when needed — enables infinite lists: `[1..]`
- **Strong static typing**: Type inference via Hindley-Milner — rarely need explicit type annotations
- **Immutability**: All values are immutable — `let x = 5` cannot be reassigned
- **Referential transparency**: Expressions can be replaced with their values without changing behavior

## Types
- **Basic types**: `Int`, `Integer` (arbitrary precision), `Float`, `Double`, `Char`, `Bool`, `String` (alias for `[Char]`)
- **Type signatures**: `add :: Int -> Int -> Int` — curried functions; `add 1 2` means `(add 1) 2`
- **Type classes**: `Eq`, `Ord`, `Show`, `Read`, `Num`, `Fractional`, `Integral` — ad-hoc polymorphism
- **Algebraic data types**: `data Maybe a = Nothing | Just a` — sum (|) and product (fields) types
- **Type synonyms**: `type Name = String` — just aliases, no new type safety
- **Newtypes**: `newtype Phone = Phone String` — zero-cost wrapper for type safety and different instances

## Functions
- **Pure functions**: Input → output, no side effects, no modification of external state
- **Higher-order**: Functions take/resume functions as arguments — `map`, `filter`, `foldl`, `foldr`
- **Partial application**: `add x y = x + y`; `addOne = add 1` — apply only some arguments
- **Composition**: `(f . g) x = f (g x)` — chain functions right-to-left
- **Lambda**: `\x -> x * 2` — anonymous function
- **Pattern matching**: `factorial 0 = 1; factorial n = n * factorial (n - 1)`
- **Guards**: `absolute n | n >= 0 = n | otherwise = -n`

## Monads
- **IO Monad**: Encapsulates side effects — `main :: IO ()`, `<-` to extract value from IO
- **Maybe Monad**: Computations that can fail — `Just 3 >>= (\x -> Just (x * 2))`
- **Either Monad**: Computations with error messages — `Left error` or `Right value`
- **List Monad**: Non-determinism — `[1,2] >>= \x -> [3,4] >>= \y -> return (x, y)`
- **do-notation**: Imperative-looking syntax for monads — `do { x <- action; return (x + 1) }`
- **Monad transformers**: Combine monadic effects — `ReaderT`, `StateT`, `WriterT`, `ExceptT`

## Common Extensions
- **GADTs**: Generalized Algebraic Data Types — more precise type parameters in constructors
- **TypeFamilies**: Associated type families for type-level functions
- **OverloadedStrings**: `"hello"` can be `String`, `Text`, `ByteString`, etc.
- **Deriving**: `data Foo = Foo deriving (Show, Eq)` — auto-implement type classes
- **ApplicativeDo**: `do` notation for `Applicative` (not just `Monad`) — better parallelism

## Tooling
- **GHC**: Glasgow Haskell Compiler — most widely used, LLVM backend for fast code
- **Cabal**: Package manager — `cabal init`, `cabal build`, `cabal test`
- **Stack**: Dependency manager with curated snapshots — `stack new`, `stack build`
- **HLS**: Haskell Language Server — IDE features, type errors inline, code actions
- **Haddock**: Documentation generation from source annotations
- **QuickCheck**: Property-based testing — define properties, generate random test cases

## Performance
- **Strictness**: Lazy evaluation can cause space leaks — `seq` / `deepseq` forces evaluation
- **Profiling**: GHC profiling (`-prof -fprof-auto`) for time and allocation analysis
- **FFI**: Foreign Function Interface for calling C libraries
- **SIMD**: GHC supports LLVM vectorization for numeric code
