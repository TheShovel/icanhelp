# Algorithms & Data Structures (Advanced)

## Sorting & Searching

### Sorting Algorithms
- **Merge sort**: divide array in half recursively, sort each half, merge. O(n log n) time, O(n) space (not in-place). Stable. Guaranteed performance (no worst-case like quicksort). Best for sorting linked lists (no random access needed). T = 2T(n/2) + O(n)
  - Top-down: recursive split until 1 element, merge pairs. Bottom-up: start merging from size-1 groups: merge pairs, increasing sizes 2,4,8...
- **Quicksort**: pick pivot, partition (elements < pivot left, > right), recurse. Average O(n log n), worst O(n²) if bad pivot (sorted array + first element pivot). In-place. Heavily used in practice (hardware-optimized). Pivot selection: random, median-of-three (first, middle, last). Tail recursion optimization: recurse on smaller partition first
  - 3-way quicksort: partition into < pivot, = pivot, > pivot. Good for many duplicates (Dutch national flag problem). O(n)
  - Dual-pivot quicksort (Java's Arrays.sort): uses 2 pivots -> 3 partitions. 20% fewer swaps than standard
- **Heapsort**: build max heap -> repeatedly extract max -> sorted. O(n log n), in-place. Not stable. Slower than quicksort in practice (cache misses: heap has scattered memory access pattern). But good for worst-case guarantee (no O(n²))
- **Counting sort**: for integers with limited range (k). Count occurrences, calculate positions. O(n+k) time, O(k) space. Not comparison-based. Stable. Best when k = O(n) (e.g., sort 10⁶ numbers from 0-1000). Radix sort: sort by each digit, stable counting sort on each digit. O(d × (n+k)) where d = digits, k = base
- **Tim sort**: hybrid merge + insertion sort. Used in Python, Java, JavaScript. Adaptive: O(n) on already sorted data, O(n log n) worst. Find natural runs (already sorted subsequences), merge them with galloping mode (binary search merge positions). Insertion sort for small runs (32-64 elements, insertion sort faster at these sizes due to less overhead)

### Searching
- **Binary search**: O(log n) on sorted array. Low = 0, high = n-1, while low ≤ high, mid = (low+high)/2. Find first/last occurrence: modify condition to not stop at first equality. Check bounds to avoid overflow: low + (high-low)/2 safer than (low+high)/2 (overflow for large ints in some languages)
- **Exponential search**: find range (double the search index until element < target), binary search within range. O(log n). Good for unbounded/infinite arrays
- **Interpolation search**: estimate position based on value distribution (like looking up a name in a phone book). O(log log n) for uniform distribution, O(n) worst. For sorted, uniformly distributed data only (array values must be uniformly distributed integers — e.g., 1-1000, not [1,2,5,450,1000])

## Data Structures

### Hash Tables
- **Load factor**: n/buckets. Rehash when load factor > 0.75 (or other threshold — can be 1.0 for open addressing with good probing). Resize: typically double buckets, rehash all entries (O(n)). Avoids high collision rates
- **Collision resolution**: separate chaining (linked list or tree per bucket — Java 8+ uses tree when bucket size > 8, falls back to list under 6). Linear probing (next free slot: if slot i occupied, try i+1, i+2,...). Quadratic probing (i+1², i+2², i+3²...) or double hashing (h₁(key) + j × h₂(key) mod m — h₂ must be != 0, h₂(key) = prime - (key % prime))
  - Open addressing: good cache performance (sequential memory). Bad for high load factor (>0.8 = many probes). Degrades with deletion: need tombstones or backward shift deletion
- **Consistent hashing**: used in distributed systems (DynamoDB, Cassandra, Redis Cluster). Hash ring: each node = point(s) on ring. Key = hash, routed to nearest clockwise node. Adding/removing node: only O(1/n) keys remapped (not ALL). Virtual nodes: each physical node maps to multiple points on ring for better load distribution with non-uniform hash distribution
  - Applications: CDN (cache server selection), database sharding, load balancers. Avoids total cache invalidation on node addition/removal

### Trees
- **Binary Search Tree**: average O(log n), worst O(n) (skewed). Balanced BST: AVL (height difference ≤ 1, stricter, more rotations). Red-Black (color + 5 properties, less strict, fewer rotations, faster insert/delete). Advantage over hash table: sorted order traversal, range queries, predecessor/successor in O(log n). Disadvantage: O(log n) vs O(1) average for hash table
  - AVL rotations: LL, RR, LR, RL. Insert: bottom-up. Delete: may need multiple rotations (up to O(log n)). Better for lookup-heavy workloads (search > insert). Red-black: max height 2log(n+1). Properties: root black, no consecutive reds, every path same number of blacks
- **B-Tree**: self-balancing with many children per node (order m). Designed for disk storage (big blocks, minimize disk reads). Each node stores multiple keys (m-1). Internal nodes: have children. Every node except root: at least ceil(m/2) children. Height ≤ log_{ceil(m/2)} N. Used in: databases (SQLite, PostgreSQL, MySQL InnoDB), filesystems (NTFS, HFS, ext4). B+Tree: only leaves store data, internal nodes = keys only. Better range queries (linked list of leaves)
- **Trie (prefix tree)**: stores strings by characters. Each node = character. Search time: O(L) where L = key length (independent of number of keys!). Good for: autocomplete, spell check, IP routing (longest prefix match), dictionary with prefix search. Memory heavy: each node has array of 26+ pointers (can compress to radix tree/Patricia trie: combine single-child nodes). Suffix tree: trie of all string suffixes — O(m) build, O(1) pattern search? No, O(n) preprocess, O(P) search
- **Segment tree**: range queries + point updates O(log n). Store sums, mins, max, etc., in segment intervals. Recursive structure: leaf = index, internal = sum/min/max of children. 4n array size for n elements. Used for: range sum queries + updates, range minimum query + updates, interval scheduling

### Heaps
- **Binary heap**: array-based complete binary tree (index i: children = 2i+1, 2i+2; parent = (i-1)/2). Min-heap (parent < children) or max-heap (parent > children). Insert: add at end, bubble up (percolate up: compare with parent, swap if out of order). Extract root: swap with last element, bubble down. Both O(log n). Build heap from array: O(n) with Floyd's method (heapify each node from n/2 down to 0)
  - Use: priority queue, Dijkstra, Prim, Kruskal, Huffman coding, selection algorithms (find kth min/max in O(k log n))
- **Fibonacci heap**: O(1) insert, O(log n) extract-min, O(1) decrease-key (amortized). More complex, larger constants. Good for: Dijkstra with dense graphs, Prim's algorithm. Lazy: don't consolidate during insert, defer to extract-min. Marked nodes: lose child, marked=true; lose second child, cut node to root
- **Pairing heap**: simpler than Fibonacci, O(log n) amortized for most operations. Used in practice (Haskell, some C++ std libs)

### Graphs
- **Representation**: adjacency list (array of lists per vertex — most common, O(V+E) space). Adjacency matrix (V² space, O(1) edge check). Edge list (list of (u, v, w) triples — for Kruskal's algorithm)
- **Traversal**: DFS (recursive stack — O(V+E) time, O(V) recursion may overflow for deep graphs. Iterative with explicit stack for safety). BFS (queue — shortest path in unweighted graph). Topological sort: DFS postorder or Kahn's algorithm (in-degree count, queue of nodes with in-degree 0)
- **Shortest path**: Dijkstra (non-negative weights, O(E log V) with binary heap. Use Fibonacci heap for O(E + V log V)). Bellman-Ford (negative weights, O(VE), detect negative cycles). Floyd-Warshall (all-pairs, O(V³), negative weights OK, no negative cycles). A* (Dijkstra + heuristic, for goal-directed search — admissible heuristic doesn't overestimate cost. For grid: Manhattan distance, Euclidean distance)
  - Dijkstra pseudocode: PQ<dist,node>, dist[start]=0, for each neighbor: if dist[u]+w(u,v) < dist[v], update

### Union-Find (Disjoint Set Union - DSU)
- **Operations**: make-set (create element), find (which set?), union (merge two sets). Near O(1) amortized with path compression + union by rank/size
  - Union by size: always attach smaller tree root to larger. Union by rank: similar, track height (rank). Path compression: during find, set node's parent to root (collapses tree). Together: inverse Ackermann function — essentially constant for all practical n
  - Applications: connected components in graph (Kruskal's algorithm), image segmentation, network connectivity, dynamic connectivity, computer registry equivalence

## Algorithmic Techniques

### Dynamic Programming
- **Optimal substructure**: optimal solution contains optimal solutions to subproblems (shortest path, longest increasing subsequence, knapsack, edit distance)
- **Overlapping subproblems**: same subproblems used multiple times (memoization or tabulation). Contrast: divide-and-conquer (subproblems independent — merge sort)
- **Top-down vs bottom-up**: top-down = memoization (recursive + cache). Bottom-up = tabulation (iterative, fills table). Bottom-up avoids recursion overhead + stack overflow. Table dimension = number of state variables (knapsack: if items + capacity → 2D)
- **Examples**: Fibonacci (O(n) vs O(2^n) naive). 0/1 Knapsack: DP[w] = items weight w with value. Longest Common Subsequence: table[i][j] = LCS of prefix i,j. Edit Distance (Levenshtein): table[i][j] = min cost to convert a[0..i-1] to b[0..j-1]. Longest Increasing Subsequence: O(n²) DP or O(n log n) with patience sorting (binary search to find placement in array of smallest tails). Rod Cutting: max profit for length n. Matrix Chain Multiplication: minimize scalar multiplications

### Greedy Algorithms
- **Properties**: optimal substructure + greedy choice property (local optimum → global optimum). Must prove: greedy choice is always safe + optimal substructure
- **Examples**: Huffman coding (merge least-frequent characters), Dijkstra (nearest unvisited), Prim (nearest vertex to tree), Kruskal (smallest edge not forming cycle), Fractional Knapsack (highest value/weight), Interval scheduling (earliest finish time), Coin change with canonical coin system (US coins)

### Divide & Conquer
- **Pattern**: divide into smaller subproblems → solve recursively → combine results. Common: recurrence T(n) = aT(n/b) + f(n). Master theorem: T(n) = aT(n/b) + O(n^d). Cases: if d > log_b(a): O(n^d). If d = log_b(a): O(n^d log n). If d < log_b(a): O(n^{log_b(a)})
- **Examples**: Merge sort, quicksort, binary search, Strassen matrix multiplication (O(n^2.8) vs O(n³)), Karatsuba multiplication (O(n^{1.585}) vs O(n²)), closest pair of points (O(n log n) — sort by x, divide, combine based on min distance, sweep strip within d to compare sorted y)

### Backtracking
- **Pruning**: stop exploring if partial solution cannot lead to complete solution. Branch and bound: same idea for optimization (prune if bound worse than best found)
- **Examples**: N-Queens (place queens column by column, skip attacked positions). Sudoku solver (fill empty cell, try numbers 1-9, backtrack if conflict). Subset sum (sort, prune if remaining sum < target). Hamiltonian path (try vertex, prune if no remaining unvisited neighbor). Knapsack backtrack (choose weight, prune if weight exceeds capacity; bound: remaining possible value = current + sum of fractional next items sorted by value/weight)
