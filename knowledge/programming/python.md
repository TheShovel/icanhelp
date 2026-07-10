# Python

## Basics
- Indentation is significant (4 spaces)
- `#` for single-line comments
- `"""docstring"""` for multi-line strings and documentation
- No `var`/`let` keywords — simple `name = value` assignment
- Dynamic typing

## Types
- `int` — arbitrary precision integer
- `float` — IEEE 754 double-precision
- `complex` — complex numbers (`1+2j`)
- `bool` — subclass of int (`True`/`False`)
- `str` — immutable Unicode string
- `bytes` — immutable byte sequence
- `bytearray` — mutable byte sequence
- `list` — mutable ordered collection `[1, 2, 3]`
- `tuple` — immutable ordered collection `(1, 2, 3)`
- `dict` — key-value mapping `{"a": 1}`
- `set` — unordered unique elements `{1, 2, 3}`
- `frozenset` — immutable set
- `None` — null value (`NoneType`)

## Strings
```python
s = "hello"
s = 'hello'
s = f"value is {x}"           # f-string (Python 3.6+)
s = r"raw\nstring"            # raw (no escape)
s = """multi
line"""
s.upper(), s.lower()          # case conversion
s.strip(), s.lstrip(), s.rstrip()  # trim whitespace
s.split(",")                  # split into list
",".join(["a", "b"])          # join list into string
s.replace("old", "new")       # replace
s.find("sub")                 # index or -1
s.startswith("pre")           # boolean
s.endswith("suf")             # boolean
s[0], s[-1]                   # first, last char
s[1:3]                       # slice [1,3)
len(s)                        # length
```

## Lists
```python
lst = [1, 2, 3]
lst.append(4)                 # add end
lst.extend([5, 6])            # extend
lst.insert(0, 0)              # insert at index
lst.pop()                     # remove end (returns element)
lst.pop(0)                    # remove at index
lst.remove(2)                 # remove first match
lst.sort()                    # in-place sort
sorted(lst)                   # new sorted list
lst.reverse()                 # in-place reverse
len(lst)                      # length
[x*2 for x in lst]           # list comprehension
[x for x in lst if x > 2]    # list comprehension with filter
{len(x) for x in lst}        # set comprehension
{x: x*2 for x in lst}        # dict comprehension
```

## Dictionaries
```python
d = {"a": 1, "b": 2}
d["c"] = 3                    # set
d.get("a", default)           # safe get
d.setdefault("d", 4)          # set if missing
d.keys(), d.values(), d.items()
d.pop("a")                    # remove, return value
d.popitem()                   # remove last inserted
d.update({"b": 20})           # merge
del d["b"]                    # delete
"a" in d                      # membership
{k: v*2 for k, v in d.items()} # dict comprehension
```

## Control Flow
```python
if condition:
    ...
elif other:
    ...
else:
    ...

for item in iterable:
    ...

for i, item in enumerate(iterable):
    ...

for a, b in zip(list1, list2):
    ...

while condition:
    ...

# Ternary
x = a if condition else b

# Match (Python 3.10+)
match value:
    case 1:
        ...
    case "hello":
        ...
    case _:
        ...     # default
```

## Functions
```python
def func(a, b=5, *args, **kwargs):
    """Docstring"""
    return a + b

# Lambda
square = lambda x: x**2

# Type hints (Python 3.5+)
def add(a: int, b: int) -> int:
    return a + b

# Decorator
@decorator
def func():
    ...

# Generator
def gen():
    yield 1
    yield 2
```

## File I/O
```python
with open("file.txt", "r") as f:
    content = f.read()           # entire file
    lines = f.readlines()        # list of lines
    for line in f:               # iterate lines

with open("file.txt", "w") as f:
    f.write("content")

with open("file.txt", "a") as f:
    f.write("appended")
```
Modes: `r` read, `w` write (overwrite), `a` append, `r+` read+write,
`rb`/`wb` binary, `x` exclusive create

## Common Standard Library Modules
```python
import os
os.path.join("dir", "file")
os.path.exists(path)
os.environ["HOME"]
os.listdir("/path")
os.makedirs("/path", exist_ok=True)
os.walk("/path")               # recursive tree

from pathlib import Path
Path("/path").mkdir(parents=True, exist_ok=True)
Path("/path").read_text()
p = Path("/path/to/file.py")
p.stem    # "file"
p.suffix  # ".py"
p.parent  # "/path/to"
p.name    # "file.py"

import sys
sys.argv                       # CLI args
sys.exit(0)                    # exit
sys.path                       # module search path
sys.platform                   # "linux"

import json
json.dumps(obj)                # serialize to string
json.dump(obj, file)           # serialize to file
json.loads(string)             # parse from string
json.load(file)                # parse from file

import re
re.search(pattern, string)     # first match
re.match(pattern, string)      # match at start
re.findall(pattern, string)    # all matches
re.sub(pattern, repl, string)  # replace
re.split(pattern, string)      # split

import argparse
parser = argparse.ArgumentParser()
parser.add_argument("--verbose", action="store_true")
args = parser.parse_args()

import subprocess
result = subprocess.run(["ls", "-l"], capture_output=True, text=True)
result.stdout, result.stderr, result.returncode

from datetime import datetime, timedelta
now = datetime.now()
delta = timedelta(days=7)
future = now + delta
now.isoformat()
now.strftime("%Y-%m-%d")

import shutil
shutil.copy(src, dst)
shutil.copytree(src, dst)
shutil.rmtree(path)
shutil.move(src, dst)
```

## Popular Third-Party Packages
- `requests` / `httpx` — HTTP client
- `flask` / `fastapi` — web frameworks
- `django` — full-featured web framework
- `numpy` — numerical computing
- `pandas` — data analysis
- `sqlalchemy` — ORM/database toolkit
- `psycopg2` — PostgreSQL adapter
- `pytest` — testing framework
- `pillow` (PIL) — image processing
- `beautifulsoup4` / `lxml` — HTML/XML parsing
- `rich` — rich terminal output
- `click` — CLI framework
- `pydantic` — data validation

## Virtual Environments
```bash
python -m venv .venv
source .venv/bin/activate
pip install package
pip freeze > requirements.txt
deactivate
```

## pip
```bash
pip install package
pip install package==1.2.3
pip install -r requirements.txt
pip list                     # installed packages
pip show package             # package details
pip uninstall package
pip cache purge
```
