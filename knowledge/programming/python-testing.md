# Python Testing (pytest)

## Installation

```bash
# Basic
pip install pytest

# With common plugins
pip install pytest pytest-cov pytest-mock pytest-xdist pytest-asyncio

# Development
pip install -e ".[dev]"
```

## Basic Usage

```bash
# Run all tests
pytest

# Run specific file
pytest tests/test_module.py

# Run specific test
pytest tests/test_module.py::test_function
pytest tests/test_module.py::TestClass::test_method

# Run with pattern
pytest -k "test_user and not slow"

# Run with markers
pytest -m "integration"
pytest -m "not slow"

# Verbose
pytest -v
pytest -vv  # More verbose

# Show output
pytest -s  # Don't capture stdout/stderr
pytest --capture=tee-sys  # Show and capture
```

## Test Structure

### Basic Test

```python
# tests/test_example.py
import pytest


def test_addition():
    assert 1 + 1 == 2


def test_string():
    assert "hello" == "hello"


class TestMath:
    def test_multiplication(self):
        assert 2 * 3 == 6

    def test_division(self):
        assert 6 / 2 == 3
```

### Fixtures

```python
# tests/conftest.py
import pytest
from my_package import Database, User


@pytest.fixture
def db():
    """Database fixture with setup/teardown."""
    db = Database(":memory:")
    db.connect()
    yield db
    db.close()


@pytest.fixture
def user(db):
    """User fixture depending on db."""
    user = User(name="Test", email="test@example.com")
    db.save(user)
    return user


@pytest.fixture(scope="session")
def session_db():
    """Session-scoped database."""
    db = Database("test.db")
    db.connect()
    yield db
    db.close()
    import os
    os.unlink("test.db")


@pytest.fixture
def sample_data():
    """Simple data fixture."""
    return {"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]}
```

```python
# tests/test_user.py
def test_user_creation(user):
    assert user.name == "Test"
    assert user.email == "test@example.com"


def test_user_in_db(db, user):
    found = db.get_user(user.id)
    assert found is not None
    assert found.name == user.name


def test_with_sample_data(sample_data):
    assert len(sample_data["users"]) == 2
```

### Fixture Scopes

| Scope | Description |
|-------|-------------|
| `function` | Default, runs per test function |
| `class` | Runs once per test class |
| `module` | Runs once per module |
| `package` | Runs once per package |
| `session` | Runs once per test session |

### Fixture Parameters

```python
@pytest.fixture(params=["sqlite", "postgresql", "mysql"])
def db_type(request):
    return request.param


@pytest.fixture(params=[1, 2, 3, 5, 10])
def batch_size(request):
    return request.param
```

```python
def test_database_operations(db_type):
    # Runs 3 times with different db_type
    db = Database(db_type)
    ...
```

### Fixture Factories

```python
@pytest.fixture
def make_user(db):
    """Factory fixture for creating users."""
    def _make_user(name, email):
        user = User(name=name, email=email)
        db.save(user)
        return user
    return _make_user


def test_multiple_users(make_user):
    user1 = make_user("Alice", "alice@example.com")
    user2 = make_user("Bob", "bob@example.com")
    assert user1.id != user2.id
```

## Parametrized Tests

```python
@pytest.mark.parametrize("input,expected", [
    (1, 2),
    (2, 4),
    (3, 6),
    (0, 0),
    (-1, -2),
])
def test_double(input, expected):
    assert input * 2 == expected


@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (0, 0, 0),
    (-1, 1, 0),
    (100, 200, 300),
], ids=["positive", "zeros", "negative", "large"])
def test_add(a, b, expected):
    assert a + b == expected


# With fixtures
@pytest.mark.parametrize("user_data", [
    {"name": "Alice", "email": "alice@example.com"},
    {"name": "Bob", "email": "bob@example.com"},
], indirect=True)
def test_user_creation(user_data):
    assert user_data.name in ["Alice", "Bob"]
```

```python
# conftest.py
@pytest.fixture
def user_data(request):
    return User(**request.param)
```

## Marks

### Built-in Marks

```python
# Skip
@pytest.mark.skip(reason="Not implemented")
def test_not_ready():
    pass


@pytest.mark.skipif(sys.version_info < (3, 10), reason="Requires Python 3.10+")
def test_python310_feature():
    pass


# XFail (expected to fail)
@pytest.mark.xfail(reason="Known bug #123")
def test_known_bug():
    assert False


@pytest.mark.xfail(run=False, reason="Crashes CI")
def test_crashes():
    pass


# Parametrize (also a mark)
@pytest.mark.parametrize("x", [1, 2, 3])
def test_param(x):
    pass
```

### Custom Marks

```python
# conftest.py
def pytest_configure(config):
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
    config.addinivalue_line("markers", "unit: marks tests as unit tests")
    config.addinivalue_line("markers", "external: marks tests requiring external services")


# tests/test_api.py
@pytest.mark.slow
def test_large_dataset():
    ...


@pytest.mark.integration
def test_database_connection():
    ...


@pytest.mark.external
def test_github_api():
    ...
```

```bash
# Run only unit tests
pytest -m "unit"

# Skip slow tests
pytest -m "not slow"

# Run integration tests
pytest -m "integration"

# Combine
pytest -m "integration and not external"
```

## Mocking

### pytest-mock (Fixtures)

```python
# tests/test_service.py
def test_external_api(mocker):
    mock_response = mocker.Mock()
    mock_response.json.return_value = {"data": "value"}
    mock_response.status_code = 200

    mocker.patch("requests.get", return_value=mock_response)

    result = fetch_data()
    assert result == {"data": "value"}
    requests.get.assert_called_once_with("https://api.example.com/data")


def test_with_spy(mocker):
    from my_module import process_data

    spy = mocker.spy(process_data, "transform")
    result = process_data.run({"input": "test"})

    spy.assert_called_once_with({"input": "test"})
    assert result == "expected"
```

### unittest.mock

```python
from unittest.mock import Mock, patch, MagicMock, call


@patch("my_module.external_service")
def test_with_patch(mock_service):
    mock_service.get_data.return_value = {"key": "value"}
    result = my_module.fetch()
    assert result == "value"
    mock_service.get_data.assert_called_once()


def test_mock_context_manager():
    with patch("my_module.Database") as mock_db:
        mock_instance = mock_db.return_value
        mock_instance.query.return_value = [1, 2, 3]

        result = my_module.get_all()
        assert result == [1, 2, 3]


def test_side_effect():
    mock = Mock(side_effect=[1, 2, 3, Exception("error")])
    assert mock() == 1
    assert mock() == 2
    assert mock() == 3
    with pytest.raises(Exception):
        mock()


def test_mock_calls():
    mock = Mock()
    mock.method(1)
    mock.method(2)
    mock.method(3)

    mock.method.assert_has_calls([call(1), call(2), call(3)])
    assert mock.method.call_count == 3
```

### Mocking Async

```python
import pytest
from unittest.mock import AsyncMock


@pytest.fixture
def mock_async_client():
    return AsyncMock()


async def test_async_call(mock_async_client):
    mock_async_client.get.return_value = {"data": "value"}
    result = await fetch_async(mock_async_client)
    assert result == {"data": "value"}
    mock_async_client.get.assert_awaited_once_with("/api/data")
```

## Assertions

### Basic Assertions

```python
def test_assertions():
    # Equality
    assert 1 == 1
    assert "hello" == "hello"
    assert [1, 2] == [1, 2]

    # Truthiness
    assert True
    assert [1, 2]
    assert {"a": 1}

    # Comparison
    assert 1 < 2
    assert 2 > 1
    assert 1 <= 1
    assert 2 >= 1

    # Membership
    assert 1 in [1, 2, 3]
    assert "a" in {"a": 1}
    assert "hello" in "hello world"

    # Identity
    assert a is b
    assert a is not b

    # None
    assert x is None
    assert x is not None

    # Exception
    with pytest.raises(ValueError):
        raise ValueError("error")

    with pytest.raises(ValueError, match="error message"):
        raise ValueError("error message")

    # Warnings
    with pytest.warns(DeprecationWarning):
        warnings.warn("deprecated", DeprecationWarning)
```

### Advanced Assertions

```python
def test_advanced_assertions():
    # Approximate equality
    assert 0.1 + 0.2 == pytest.approx(0.3)
    assert 0.1 + 0.2 == pytest.approx(0.3, rel=1e-2)
    assert 0.1 + 0.2 == pytest.approx(0.3, abs=1e-2)

    # Sequence comparison
    assert [1, 2, 3] == pytest.approx([1, 2, 3])
    assert [1, 2, 3] == [1, 2, 3]

    # Set comparison
    assert {1, 2, 3} == {1, 2, 3}

    # Dict comparison
    assert {"a": 1, "b": 2} == {"a": 1, "b": 2}

    # Custom assertion messages
    assert 1 == 2, "Custom message: 1 should equal 2"
```

## Async Testing

```python
# tests/test_async.py
import pytest
import asyncio


@pytest.mark.asyncio
async def test_async_function():
    result = await async_function()
    assert result == "done"


@pytest.mark.asyncio
async def test_multiple_async():
    results = await asyncio.gather(
        async_func(1),
        async_func(2),
        async_func(3),
    )
    assert results == [1, 2, 3]


# Async fixtures
@pytest.fixture
async def async_db():
    db = await AsyncDatabase.connect()
    yield db
    await db.close()


@pytest.mark.asyncio
async def test_with_async_fixture(async_db):
    result = await async_db.query("SELECT 1")
    assert result == 1
```

```toml
# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

## Parallel Testing

```bash
# Install pytest-xdist
pip install pytest-xdist

# Run with auto workers
pytest -n auto

# Run with specific workers
pytest -n 4

# Distribute by test module
pytest -n 4 --dist=loadfile

# Distribute by test function
pytest -n 4 --dist=loadscope

# Loop on failure (for flaky tests)
pytest --forked -n 4
```

## Coverage

```bash
# Install
pip install pytest-cov

# Basic coverage
pytest --cov=my_package

# Terminal report
pytest --cov=my_package --cov-report=term-missing

# HTML report
pytest --cov=my_package --cov-report=html

# XML for CI
pytest --cov=my_package --cov-report=xml

# Multiple packages
pytest --cov=my_package --cov=other_package

# Branch coverage
pytest --cov=my_package --cov-branch

# Fail under threshold
pytest --cov=my_package --cov-fail-under=80
```

```toml
# pyproject.toml
[tool.coverage.run]
source = ["src/my_package"]
omit = ["*/tests/*"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
]
fail_under = 80
```

## Test Organization

### Directory Structure

```
tests/
├── __init__.py
├── conftest.py           # Shared fixtures
├── unit/
│   ├── __init__.py
│   ├── test_core.py
│   └── test_utils.py
├── integration/
│   ├── __init__.py
│   ├── test_database.py
│   └── test_api.py
└── e2e/
    ├── __init__.py
    └── test_workflows.py
```

### conftest.py Hierarchy

```
tests/
├── conftest.py           # Global fixtures
├── unit/
│   ├── conftest.py       # Unit test fixtures
│   └── test_core.py
└── integration/
    ├── conftest.py       # Integration fixtures
    └── test_db.py
```

## Debugging

```bash
# Drop into PDB on failure
pytest --pdb

# Drop into PDB on error
pytest --trace

# Show local variables
pytest -l

# Show locals on failure
pytest --tb=long

# Stop on first failure
pytest -x

# Stop after N failures
pytest --maxfail=3

# Run last failed
pytest --lf

# Run failed first
pytest --ff

# Verbose traceback
pytest --tb=long
pytest --tb=short
pytest --tb=line
pytest --tb=native
```

```python
# In test code
import pytest

def test_debug():
    pytest.set_trace()  # Breakpoint
    # Or
    import pdb; pdb.set_trace()
    # Or (Python 3.7+)
    breakpoint()
```

## Plugins

### Popular Plugins

```bash
# Parallel testing
pip install pytest-xdist

# Coverage
pip install pytest-cov

# Mocking
pip install pytest-mock

# Async
pip install pytest-asyncio

# Benchmarking
pip install pytest-benchmark

# Hypothesis (property-based)
pip install hypothesis

# Django
pip install pytest-django

# Flask
pip install pytest-flask

# Time traveling
pip install pytest-freezegun

# Snapshot testing
pip install pytest-snapshot

# Test ordering
pip install pytest-order

# Retry flaky tests
pip install pytest-rerunfailures

# HTML reports
pip install pytest-html

# JUnit XML
pip install pytest-junitxml
```

### Hypothesis (Property-Based Testing)

```python
from hypothesis import given, strategies as st


@given(st.integers(), st.integers())
def test_add_commutative(a, b):
    assert a + b == b + a


@given(st.lists(st.integers()))
def test_sort_idempotent(lst):
    assert sorted(sorted(lst)) == sorted(lst)


@given(st.text())
def test_repr_roundtrip(s):
    obj = MyClass(s)
    assert repr(obj) == s
```

## Configuration

### pytest.ini / pyproject.toml

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
    "ignore::PendingDeprecationWarning",
]
console_output_style = "progress"
faulthandler_timeout = 30
```

### Environment Variables

```bash
# Disable color
PY_COLORS=0 pytest

# Force color
PY_COLORS=1 pytest

# Timeout
PYTEST_TIMEOUT=30 pytest

# Debug
PYTEST_DEBUG=1 pytest
```

## Common Patterns

### Test Data Builders

```python
# tests/builders.py
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class UserBuilder:
    name: str = "Test User"
    email: str = "test@example.com"
    age: int = 25
    is_active: bool = True
    roles: list = field(default_factory=list)

    def with_name(self, name: str):
        self.name = name
        return self

    def with_email(self, email: str):
        self.email = email
        return self

    def inactive(self):
        self.is_active = False
        return self

    def admin(self):
        self.roles.append("admin")
        return self

    def build(self) -> User:
        return User(
            name=self.name,
            email=self.email,
            age=self.age,
            is_active=self.is_active,
            roles=self.roles,
        )


# Usage
def test_user_builder():
    user = UserBuilder().with_name("Alice").admin().build()
    assert user.name == "Alice"
    assert "admin" in user.roles
```

### Fixtures for External Services

```python
# conftest.py
import pytest
from testcontainers.postgres import PostgresContainer


@pytest.fixture(scope="session")
def postgres():
    container = PostgresContainer("postgres:16")
    container.start()
    yield container.get_connection_url()
    container.stop()


@pytest.fixture
def db_session(postgres):
    engine = create_engine(postgres)
    Base.metadata.create_all(engine)
    session = Session(engine)
    yield session
    session.close()
    Base.metadata.drop_all(engine)
```

### Snapshot Testing

```python
# tests/test_snapshot.py
def test_user_snapshot(snapshot):
    user = User(name="Alice", email="alice@example.com")
    snapshot.assert_match(user.to_dict())


# Update snapshots
pytest --snapshot-update
```

## Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**: `test_user_cannot_login_with_wrong_password`
3. **One assertion per test** (when practical)
4. **Use fixtures for setup/teardown**
5. **Keep tests independent** (no shared state)
6. **Use parametrize for similar tests**
7. **Mark slow/integration/external tests**
8. **Run fast tests frequently, slow tests in CI**
9. **Use `-x` for quick feedback during development**
10. **Maintain test coverage above 80%**
11. **Use hypothesis for complex logic**
12. **Mock external dependencies**
13. **Test edge cases and error paths**
14. **Keep test files organized** (unit/integration/e2e)
15. **Use conftest.py for shared fixtures**

## Troubleshooting

```bash
# Tests not discovered
pytest --collect-only

# Import errors
python -m pytest tests/

# Fixture not found
pytest --fixtures

# Show all markers
pytest --markers

# Show cache
pytest --cache-show
pytest --cache-clear

# Verbose import tracing
pytest -v --import-mode=append
```