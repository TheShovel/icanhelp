# Algorithms & Data Structures

## Big O Notation
- **O(1)** — constant: array access by index, hash table lookup (average)
- **O(log n)** — logarithmic: binary search, balanced tree operations
- **O(n)** — linear: array search, linked list traversal
- **O(n log n)** — linearithmic: mergesort, heapsort, quicksort (average)
- **O(n²)** — quadratic: nested loops, bubble sort, insertion sort
- **O(2ⁿ)** — exponential: recursive Fibonacci (naive), subset generation
- **O(n!)** — factorial: permutation generation, traveling salesman (brute force)

### Rules of Thumb
- Drop constants: O(2n) → O(n)
- Drop non-dominant terms: O(n + n²) → O(n²)
- Multiple inputs → separate variables: O(a × b), not O(n²)
- Amortized analysis: occasional O(n) operation averaged over many O(1) is still O(1)

## Common Data Structures

### Arrays
- Contiguous memory, O(1) index access, O(n) insert/delete (unless at end)
- **Dynamic array** (Vec, ArrayList): amortized O(1) append, doubles capacity when full
- Prefix sums: precompute `prefix[i] = sum(arr[0..i])` for O(1) range sum queries

### Linked Lists
- O(n) access/search, O(1) insert/delete at head
- **Singly**: node → next. **Doubly**: prev ↔ node ↔ next
- Used in: LRU cache (doubly + hashmap), undo/redo

### Hash Tables
- O(1) average insert/search/delete, O(n) worst-case (hash collisions)
- Load factor = items / buckets — resize when > 0.7
- Collision resolution: chaining (linked list per bucket), open addressing (probe next slot)
- Hash functions: use `hash()` or `Hasher` for custom types; avoid weak hash (DJB2, crc32)

### Stacks & Queues
- **Stack**: LIFO — push/pop O(1). Used for DFS, recursion → iteration, undo, bracket matching
- **Queue**: FIFO — enqueue/dequeue O(1). Used for BFS, task scheduling, buffering
- **Deque**: double-ended — add/remove both ends O(1). Sliding window problems

### Trees
- **Binary Tree**: each node has 0-2 children
- **Binary Search Tree (BST)**: left < parent < right — O(log n) average, O(n) worst (unbalanced)
- **AVL / Red-Black**: self-balancing BST — always O(log n)
- **B-Tree**: multi-way tree, optimized for disk/DB (many children per node)
- **Heap (Priority Queue)**: min-heap (parent < children), max-heap (parent > children)
  - insert O(log n), extract-min/max O(log n), peek O(1)
  - `heapq` (Python), `std::collections::BinaryHeap` (Rust)
- **Trie (Prefix Tree)**: O(k) search/insert (k = key length). Used in autocomplete, spell check

### Graphs
- Representation: adjacency matrix (O(1) edge check, O(V²) space), adjacency list (O(V+E) space)
- **Directed vs Undirected**, **Weighted vs Unweighted**, **Cyclic vs Acyclic**
- **DAG** (Directed Acyclic Graph): used in scheduling, topological sort, dependency resolution

### Disjoint Set (Union-Find)
- Operations: `find(x)`, `union(x, y)` — near O(1) with path compression + union by rank
- Used for: connected components, Kruskal's MST, detecting cycles, percolation

## Sorting Algorithms
| Algorithm | Best | Average | Worst | Space | Stable |
|---|---|---|---|---|---|
| Quicksort | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| Mergesort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Heapsort | O(n log n) | O(n log n) | O(n log n) | O(1) | No |
| Insertion sort | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Counting sort | O(n+k) | O(n+k) | O(n+k) | O(k) | Yes (k = range) |

## Graph Algorithms

### Traversal
- **DFS**: stack (recursive or explicit) — O(V+E). Used for topological sort, detecting cycles, connected components
- **BFS**: queue — O(V+E). Used for shortest path (unweighted), bipartite check, level-order

### Shortest Path
- **Dijkstra**: O((V+E) log V) with heap — non-negative weights only
- **Bellman-Ford**: O(VE) — handles negative weights, detects negative cycles
- **Floyd-Warshall**: O(V³) — all-pairs shortest paths
- **A***: Dijkstra + heuristic (h(x) ≤ true distance) — faster with good heuristic

### Minimum Spanning Tree
- **Kruskal**: sort edges O(E log E), union-find — good for sparse graphs
- **Prim**: heap-based O(E log V) — good for dense graphs

## Algorithm Design Paradigms
- **Divide & Conquer**: split → solve subproblems → combine (mergesort, quicksort, binary search)
- **Dynamic Programming**: memoization (top-down) or tabulation (bottom-up)
  - Overlapping subproblems + optimal substructure
  - Classic: Fibonacci, knapSack, longest common subsequence, edit distance
- **Greedy**: make locally optimal choice → global optimum (if problem has greedy choice property)
  - Classic: Huffman coding, Dijkstra, interval scheduling, coin change (canonical systems)
- **Backtracking**: try → recurse → undo. Used for: N-Queens, Sudoku, subsets, permutations
- **Two Pointers**: O(n) for sorted arrays — pair sum, palindrome check, container with most water
- **Sliding Window**: maintain window [L, R] — substring problems, max sum subarray of size k
- **Binary Search (on answer)**: search space is a range, not an array — find min feasible value

## String Algorithms
- **KMP**: O(n + m) pattern matching — prefix function (failure function)
- **Rabin-Karp**: rolling hash for O(n + m) average pattern matching
- **Z-algorithm**: O(n) — Z-array = longest substring starting at i that matches prefix
- **Manacher**: O(n) — longest palindromic substring
- **Levenshtein distance**: edit distance (insert/delete/substitute) — DP O(n×m)

## Bit Manipulation
```
x & (x-1)     — clear lowest set bit
x & -x        — isolate lowest set bit
x ^ x         — 0 (xor with self)
x ^ 0         — x
x | (1 << k)  — set bit k
x & ~(1 << k) — clear bit k
(x >> k) & 1  — get bit k
```
- Count bits: `__builtin_popcount()` (GCC), `x.bit_count()` (Rust 1.53+)
- Common tricks: parity check (`x & 1`), power of 2 check (`x > 0 && x & (x-1) == 0`)
