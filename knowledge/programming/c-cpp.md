# C & C++ Programming Basics

## C Overview
- Procedural, compiled, manual memory management, systems language
- Used for: operating systems, embedded systems, firmware, kernels, databases, game engines
- Created by Dennis Ritchie at Bell Labs (1972) — for writing Unix
- **Key features**: pointers, manual memory (malloc/free), no classes, no exceptions, no garbage collection

## C Basics
```c
#include <stdio.h>   // standard I/O
#include <stdlib.h>  // malloc, free, atoi
#include <string.h>  // strcpy, strlen, strcmp, memset
#include <stdbool.h> // bool type (C99+)

int main(int argc, char *argv[]) {
    printf("Hello, %s\n", argv[1] ? argv[1] : "world");
    return 0; // 0 = success, non-zero = error
}

// Variables
int a = 10;
float f = 3.14f;      // f suffix for float (double is default)
char c = 'A';
char *name = "Alice"; // string literal (read-only)
_Bool flag = 1;        // or bool with <stdbool.h>

// Types: char, short, int, long, long long, float, double
// Modifiers: signed, unsigned, short, long
// sizeof: size in bytes — use for portable code

// Arrays (fixed size, zero-indexed)
int arr[5] = {1, 2, 3};  // rest zero-initialized
int matrix[3][3] = {{1,2,3},{4,5,6}};
arr[0] = 10;

// Strings = character arrays with null terminator (\0)
char str[] = "hello";     // {'h','e','l','l','o','\0'} — 6 bytes!
char *s = "world";        // pointer to string literal (don't modify!)
strcpy(dest, src);        // copy string (buffer overflow risk!)
strcat(dest, src);        // concatenate (overflow risk!)
strlen(str);              // length without \0
strcmp(a, b);             // 0 if equal, <0 if a<b, >0 if a>b
snprintf(buf, size, "%d", 42); // SAFE formatted print to string
```

## Pointers (C's most important feature)
```c
int x = 42;
int *p = &x;     // p holds address of x
*p = 100;        // dereference: changes x to 100

int *ptr = NULL;  // null pointer (equals 0, must check before dereference)

// Pointer arithmetic: p + 1 moves to next element (by sizeof(type))
int arr[5] = {10, 20, 30, 40, 50};
int *p = arr;         // p points to arr[0]
*(p + 2) = 99;        // arr[2] = 99
p++;                  // now points to arr[1]

// Function pointers
void (*fp)(int) = &myFunction;
fp(42);               // calls myFunction(42)

// void* = generic pointer (must cast before dereference)
void *ptr = malloc(100);  // returns void*!
```

## Memory Management
```c
// Stack: local variables, automatic, fast, limited size (~1-8 MB)

// Heap: manually allocated, larger, slower, must free
int *arr = (int*)malloc(10 * sizeof(int));  // allocate
if (arr == NULL) { /* handle error */ }
arr[0] = 42;
free(arr);         // MUST free or memory leak!

int *arr2 = calloc(10, sizeof(int));  // allocate + zero-initialize
arr2 = realloc(arr2, 20 * sizeof(int)); // resize (may move data!)

// Common bugs: use-after-free, double-free, buffer overflow, memory leaks
// Tools: valgrind (runtime), AddressSanitizer (-fsanitize=address), gdb

// Better: allocate on stack when possible (no leak, faster)
void func() {
    int buf[256];  // stack allocation, auto-freed when func returns
}
```

## Data Structures (C)
```c
struct Point {
    int x;
    int y;
};

struct Point p = {10, 20};
p.x = 30;

typedef struct {
    char name[50];
    int age;
} Person;

Person alice = {"Alice", 30};

// Linked list
struct Node {
    int data;
    struct Node *next;
};

// Function that modifies struct via pointer
void move_point(struct Point *p, int dx, int dy) {
    p->x += dx;  // -> for pointer, . for struct
    p->y += dy;
}
```

## C++ Overview
- C with classes: OOP + templates + STL + RAII + exceptions
- Backward compatible with C (mostly)
- Used for: game engines, browsers, real-time systems, financial trading, ML frameworks
- Created by Bjarne Stroustrup (1985)

## C++ vs C Differences
```cpp
// References (syntactic sugar for pointers, can't be null)
int x = 42;
int &ref = x;   // ref is an alias for x (must initialize, can't rebind)
ref = 100;      // changes x

// Classes
class Animal {
public:
    Animal(const std::string &name) : name_(name) {}  // constructor with init list
    virtual ~Animal() = default;  // virtual destructor for polymorphic delete
    virtual void speak() const { std::cout << "..." << std::endl; }
private:
    std::string name_;
};

class Dog : public Animal {
public:
    using Animal::Animal;  // inherit constructor
    void speak() const override { std::cout << "Woof!" << std::endl; }
};

// RAII (Resource Acquisition Is Initialization)
// Resources acquired in constructor, released in destructor
// Smart pointers: std::unique_ptr, std::shared_ptr
auto ptr = std::make_unique<int>(42);  // no manual delete!
auto shared = std::make_shared<Dog>("Fido");

// STL (Standard Template Library)
std::vector<int> v = {1, 2, 3};
v.push_back(4);
std::sort(v.begin(), v.end());

std::map<std::string, int> m;
m["key"] = 42;

// Templates
template<typename T>
T max(T a, T b) { return a > b ? a : b; }
// Can be used with any type that supports >: max(3, 7), max(3.14, 2.72)

// Exceptions
try {
    // something that may throw
} catch (const std::exception &e) {
    std::cerr << e.what() << std::endl;
}
```

## Modern C++ (C++11/14/17/20)
- **auto**: type deduction (`auto x = 42; auto it = v.begin();`)
- **Range-based for**: `for (const auto &item : container)`
- **Lambda**: `[capture](params) -> return_type { body }`
- **Move semantics**: `std::move`, `std::unique_ptr` — efficient transfers without copies
- **constexpr**: compile-time evaluation — compute at compile, not runtime
- **std::optional**: may or may not contain a value (like Maybe in Rust)
- **std::variant**: type-safe union (one of several types)
- **Structured bindings**: `auto [x, y] = getPoint();`
- **Concepts** (C++20): template constraints — `template<std::integral T>`

## Safety & Best Practices
- **Prefer C++ over C** for new projects (RAII prevents resource leaks, stronger type checking, STL provides safe containers)
- Never use `gets()` (removed from standard). Prefer `fgets()` or C++ `std::getline()`
- Always check bounds — C arrays don't check, C++ `std::vector::at()` does (throws)
- Initialize all variables (uninitialized = undefined behavior)
- Use `const` whenever possible
- Prefer `nullptr` over `NULL` (type-safe, can't be accidentally integer)
- Modern C++: avoid new/delete, use smart pointers and STL containers
- Turn on compiler warnings: `-Wall -Wextra -Werror` (treat warnings as errors)
- Undefined behavior = anything can happen (crashes, security holes, time travel) — avoid at all costs
