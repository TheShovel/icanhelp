# Python Packaging (2024)

## Modern Packaging Standards

### pyproject.toml (PEP 517/518/621)

```toml
# pyproject.toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "my-package"
version = "1.0.0"
description = "A short description"
readme = "README.md"
license = {text = "MIT"}
authors = [
    {name = "Your Name", email = "you@example.com"}
]
maintainers = [
    {name = "Your Name", email = "you@example.com"}
]
keywords = ["keyword1", "keyword2"]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]
requires-python = ">=3.10"
dependencies = [
    "requests>=2.31.0",
    "click>=8.1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "ruff>=0.1.0",
    "mypy>=1.5.0",
]
docs = [
    "sphinx>=7.2.0",
    "furo>=2024.1.0",
]

[project.urls]
Homepage = "https://github.com/user/my-package"
Repository = "https://github.com/user/my-package"
Issues = "https://github.com/user/my-package/issues"
Documentation = "https://my-package.readthedocs.io"
Changelog = "https://github.com/user/my-package/blob/main/CHANGELOG.md"

[project.scripts]
my-cli = "my_package.cli:main"

[project.entry-points."console_scripts"]
my-cli = "my_package.cli:main"

[tool.hatch.build.targets.wheel]
packages = ["src/my_package"]

[tool.hatch.version]
source = "file"
path = "src/my_package/__init__.py"

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
addopts = "-v --strict-markers --strict-config"

[tool.ruff]
target-version = "py310"
line-length = 100
select = ["E", "F", "I", "N", "W", "UP", "B", "C4", "PT", "SIM", "TID", "TCH", "ARG", "PTH", "ERA", "PL", "TRY"]
ignore = ["E501", "B008"]
extend-select = ["RUF", "PERF", "RET"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = true

[tool.mypy]
python_version = "3.10"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
no_implicit_optional = true
strict = true

[tool.coverage.run]
source = ["src/my_package"]
omit = ["*/tests/*"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
]
```

### Minimal pyproject.toml (setuptools)

```toml
[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "my-package"
version = "1.0.0"
description = "A short description"
readme = "README.md"
license = {text = "MIT"}
authors = [{name = "Your Name", email = "you@example.com"}]
requires-python = ">=3.10"
dependencies = [
    "requests>=2.31.0",
]

[project.optional-dependencies]
dev = ["pytest>=7.4.0", "ruff>=0.1.0"]

[project.scripts]
my-cli = "my_package.cli:main"

[tool.setuptools.packages.find]
where = ["src"]
include = ["my_package*"]
exclude = ["tests*"]

[tool.setuptools.package-dir]
"" = "src"
```

## Package Structure

### src Layout (Recommended)

```
my-package/
├── pyproject.toml
├── README.md
├── LICENSE
├── CHANGELOG.md
├── src/
│   └── my_package/
│       ├── __init__.py
│       ├── __main__.py
│       ├── cli.py
│       ├── core.py
│       └── utils.py
├── tests/
│   ├── __init__.py
│   ├── test_core.py
│   └── test_cli.py
└── docs/
    ├── conf.py
    └── index.rst
```

### __init__.py

```python
# src/my_package/__init__.py
"""My Package - A short description."""

from .core import main_function
from .cli import main

__version__ = "1.0.0"
__all__ = ["main_function", "main"]
```

## Build Backends

### Hatchling (Fast, Modern)

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/my_package"]

[tool.hatch.version]
source = "file"
path = "src/my_package/__init__.py"
```

### setuptools (Classic, Compatible)

```toml
[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["src"]
```

### flit (Simple, Pure Python)

```toml
[build-system]
requires = ["flit_core>=3.8,<4"]
build-backend = "flit_core.buildapi"

[project]
name = "my-package"
version = "1.0.0"
description = "A short description"
authors = [{name = "Your Name", email = "you@example.com"}]
requires-python = ">=3.10"
dependencies = ["requests>=2.31.0"]

[tool.flit.module]
name = "my_package"
```

### poetry (Full Featured)

```toml
[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.poetry]
name = "my-package"
version = "1.0.0"
description = "A short description"
authors = ["Your Name <you@example.com>"]
readme = "README.md"
license = "MIT"
packages = [{include = "my_package", from = "src"}]

[tool.poetry.dependencies]
python = ">=3.10,<4.0"
requests = "^2.31.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
ruff = "^0.1.0"

[tool.poetry.scripts]
my-cli = "my_package.cli:main"
```

## Building

```bash
# Install build frontend
pipx install build

# Build (creates dist/)
python -m build

# Build specific format
python -m build --wheel
python -m build --sdist

# Build with specific backend
python -m build --no-isolation  # Use local environment

# Check build
python -m build --wheel
ls dist/
```

## Version Management

### Dynamic Version from Git (setuptools-scm)

```toml
[build-system]
requires = ["setuptools>=68.0", "wheel", "setuptools-scm"]
build-backend = "setuptools.build_meta"

[project]
name = "my-package"
# version = "1.0.0"  # Omitted - dynamic
dynamic = ["version"]

[tool.setuptools_scm]
version_scheme = "release-branch-semver"
local_scheme = "node-and-date"
```

```bash
# Install
pip install setuptools-scm

# Get version
python -m setuptools_scm
```

### Hatch Version

```toml
[tool.hatch.version]
source = "file"
path = "src/my_package/__init__.py"
# Or from git
source = "vcs"
```

```bash
# Bump version
hatch version 1.1.0
hatch version minor
hatch version patch
```

## Dependency Management

### Requirements Files

```txt
# requirements.txt (pinned for deployment)
requests==2.31.0
click==8.1.7

# requirements-dev.txt
-r requirements.txt
pytest==7.4.3
pytest-cov==4.1.0
ruff==0.1.6
mypy==1.5.1

# requirements-docs.txt
-r requirements.txt
sphinx==7.2.6
furo==2024.1.0
```

### Dependency Groups (pip 23.1+)

```bash
# Install with optional dependencies
pip install -e ".[dev]"
pip install -e ".[dev,docs]"

# Install from requirements
pip install -r requirements-dev.txt
```

### Constraints Files

```txt
# constraints.txt
requests==2.31.0
urllib3==2.1.0
certifi==2023.7.22
charset-normalizer==3.3.2
idna==3.4
```

```bash
pip install -r requirements.txt -c constraints.txt
```

## Publishing

### TestPyPI

```bash
# Build
python -m build

# Upload to TestPyPI
python -m twine upload --repository testpypi dist/*

# Install from TestPyPI
pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ my-package
```

### PyPI

```bash
# Create ~/.pypirc
cat > ~/.pypirc << EOF
[distutils]
index-servers =
    pypi
    testpypi

[pypi]
username = __token__
password = pypi-YOUR-TOKEN

[testpypi]
repository = https://test.pypi.org/legacy/
username = __token__
password = pypi-YOUR-TEST-TOKEN
EOF

# Upload
python -m twine upload dist/*

# Or with token
python -m twine upload -u __token__ -p pypi-YOUR-TOKEN dist/*
```

### Trusted Publishing (GitHub Actions)

```yaml
# .github/workflows/publish.yml
name: Publish to PyPI

on:
  release:
    types: [published]

permissions:
  id-token: write
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Install build
        run: pipx install build
      - name: Build
        run: python -m build
      - name: Publish
        uses: pypa/gh-action-pypi-publish@release/v1
```

## uv (Fast Package Manager)

```bash
# Install
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment
uv venv

# Install package in editable mode
uv pip install -e ".[dev]"

# Install from requirements
uv pip install -r requirements.txt

# Sync (exact match)
uv pip sync requirements.txt

# Compile requirements
uv pip compile pyproject.toml -o requirements.txt
uv pip compile pyproject.toml --extra dev -o requirements-dev.txt

# Build
uv build

# Publish
uv publish
```

## pipx (CLI Tool Installation)

```bash
# Install pipx
pipx ensurepath

# Install package from PyPI
pipx install my-package

# Install from local
pipx install /path/to/my-package

# Install with specific Python
pipx install --python python3.11 my-package

# Run once without installing
pipx run my-package

# List installed
pipx list

# Upgrade
pipx upgrade my-package
pipx upgrade-all

# Uninstall
pipx uninstall my-package
```

## Testing

### pytest Configuration

```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
python_classes = ["Test*"]
addopts = "-v --strict-markers --strict-config --tb=short"
markers = [
    "slow: marks tests as slow",
    "integration: marks tests as integration tests",
    "unit: marks tests as unit tests",
]
filterwarnings = [
    "ignore::DeprecationWarning",
]
```

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=my_package --cov-report=term-missing --cov-report=html

# Run specific markers
pytest -m "not slow"
pytest -m "integration"

# Run with parallel
pytest -n auto

# Run specific test
pytest tests/test_core.py::test_function
```

### Coverage

```toml
# pyproject.toml
[tool.coverage.run]
source = ["src/my_package"]
omit = ["*/tests/*", "*/conftest.py"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
]
fail_under = 80
```

```bash
# Coverage report
coverage run -m pytest
coverage report
coverage html
coverage xml  # For CI
```

## Linting & Formatting

### Ruff (Fast, All-in-One)

```bash
# Check
ruff check .

# Fix
ruff check . --fix

# Format
ruff format .

# Check + format
ruff check . --fix && ruff format .
```

```toml
# pyproject.toml
[tool.ruff]
target-version = "py310"
line-length = 100
select = ["E", "F", "I", "N", "W", "UP", "B", "C4", "PT", "SIM", "TID", "TCH", "ARG", "PTH", "ERA", "PL", "TRY"]
ignore = ["E501", "B008"]
extend-select = ["RUF", "PERF", "RET"]
preview = true

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = true

[tool.ruff.lint.perflint]
enabled = true

[tool.ruff.lint.isort]
known-third-party = ["requests", "click", "pytest"]
```

### mypy

```bash
# Check
mypy src/my_package

# Check with strict
mypy --strict src/my_package

# Generate stubs
mypy --install-types --non-interactive src/my_package
```

## Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.6
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.5.1
    hooks:
      - id: mypy
        additional_dependencies: [types-requests]

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-toml
      - id: check-added-large-files
      - id: check-merge-conflict
```

```bash
# Install
pre-commit install

# Run manually
pre-commit run --all-files
```

## CI/CD

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      - name: Install uv
        run: pipx install uv
      - name: Install dependencies
        run: uv pip install -e ".[dev]"
      - name: Lint
        run: |
          uv run ruff check .
          uv run ruff format --check .
          uv run mypy src/my_package
      - name: Test
        run: uv run pytest --cov=my_package --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  publish:
    needs: test
    if: github.event_name == 'release' && github.event.action == 'published'
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Build
        run: |
          pipx install build
          python -m build
      - name: Publish
        uses: pypa/gh-action-pypi-publish@release/v1
```

## Common Issues & Solutions

### Module Not Found After Install

```bash
# Check installed package
pip show -f my-package

# Check import
python -c "import my_package; print(my_package.__file__)"
```

### Version Conflict

```bash
# Check dependency tree
pipdeptree

# Or with uv
uv tree
```

### Build Fails

```bash
# Clean build
rm -rf dist build *.egg-info
python -m build

# Verbose
python -m build --verbose
```

### Missing Data Files

```toml
# pyproject.toml (setuptools)
[tool.setuptools.package-data]
my_package = ["data/*.json", "templates/*.html"]

# Or use MANIFEST.in
# include my_package/data/*.json
# recursive-include my_package/templates *.html
```

## Migration from setup.py

```bash
# 1. Create pyproject.toml
# 2. Move metadata from setup.py to pyproject.toml
# 3. Remove setup.py, setup.cfg
# 4. Update CI/CD
# 5. Test build
python -m build
```

## Resources

- [PEP 517](https://peps.python.org/pep-0517/) - Build backend interface
- [PEP 518](https://peps.python.org/pep-0518/) - pyproject.toml for build dependencies
- [PEP 621](https://peps.python.org/pep-0621/) - Project metadata in pyproject.toml
- [Python Packaging User Guide](https://packaging.python.org/)
- [Hatch](https://hatch.pypa.io/)
- [uv](https://github.com/astral-sh/uv)
- [pipx](https://pipx.pypa.io/)