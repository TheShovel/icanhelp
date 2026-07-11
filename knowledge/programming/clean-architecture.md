# Clean Architecture

## Overview

Clean Architecture separates concerns into layers with strict dependency rules: **inner layers never depend on outer layers**.

```
┌─────────────────────────────────────────┐
│           Frameworks & Drivers          │  ← Databases, Web, UI, External APIs
├─────────────────────────────────────────┤
│            Interface Adapters           │  ← Controllers, Presenters, Gateways
├─────────────────────────────────────────┤
│              Use Cases                  │  ← Application Business Rules
├─────────────────────────────────────────┤
│             Entities                    │  ← Enterprise Business Rules
└─────────────────────────────────────────┘
```

## Dependency Rule

**Source code dependencies must point inward**. Inner layers know nothing about outer layers.

```
Entities ← Use Cases ← Interface Adapters ← Frameworks
    ↑          ↑             ↑                  ↑
  No deps   No deps       No deps            Knows all
```

## Layer Responsibilities

### Entities (Enterprise Business Rules)

- Core business logic
- No external dependencies
- Pure domain models
- Reusable across applications

```python
# domain/entities/user.py
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class User:
    id: str
    email: str
    name: str
    created_at: datetime
    is_active: bool = True
    
    def change_email(self, new_email: str) -> None:
        if not self._is_valid_email(new_email):
            raise ValueError("Invalid email format")
        self.email = new_email
    
    def deactivate(self) -> None:
        self.is_active = False
    
    @staticmethod
    def _is_valid_email(email: str) -> bool:
        return "@" in email and "." in email.split("@")[1]
```

### Use Cases (Application Business Rules)

- Orchestrate flow of data
- Coordinate entities
- No framework dependencies
- Single responsibility per use case

```python
# application/use_cases/register_user.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

@dataclass
class RegisterUserRequest:
    email: str
    name: str
    password: str

@dataclass
class RegisterUserResponse:
    user_id: str
    success: bool
    error: Optional[str] = None

class UserRepository(ABC):
    @abstractmethod
    def save(self, user: 'User') -> None: pass
    
    @abstractmethod
    def find_by_email(self, email: str) -> Optional['User']: pass

class PasswordHasher(ABC):
    @abstractmethod
    def hash(self, password: str) -> str: pass

class RegisterUserUseCase:
    def __init__(
        self,
        user_repo: UserRepository,
        password_hasher: PasswordHasher
    ):
        self._user_repo = user_repo
        self._password_hasher = password_hasher
    
    def execute(self, request: RegisterUserRequest) -> RegisterUserResponse:
        # Check if user exists
        if self._user_repo.find_by_email(request.email):
            return RegisterUserResponse(
                user_id="",
                success=False,
                error="Email already registered"
            )
        
        # Create user
        user = User(
            id=generate_id(),
            email=request.email,
            name=request.name,
            password_hash=self._password_hasher.hash(request.password)
        )
        
        self._user_repo.save(user)
        
        return RegisterUserResponse(user_id=user.id, success=True)
```

### Interface Adapters

- Convert data between use cases and external formats
- Controllers, Presenters, Gateways
- Database implementations, API clients

```python
# interface_adapters/controllers/user_controller.py
from flask import Flask, request, jsonify

app = Flask(__name__)

class UserController:
    def __init__(self, register_use_case: RegisterUserUseCase):
        self._register_use_case = register_use_case
    
    def register(self):
        data = request.get_json()
        
        response = self._register_use_case.execute(RegisterUserRequest(
            email=data["email"],
            name=data["name"],
            password=data["password"]
        ))
        
        if response.success:
            return jsonify({"user_id": response.user_id}), 201
        return jsonify({"error": response.error}), 400
```

```python
# interface_adapters/gateways/sql_user_repository.py
import sqlite3
from typing import Optional

class SQLUserRepository(UserRepository):
    def __init__(self, connection_string: str):
        self._conn = sqlite3.connect(connection_string)
        self._init_db()
    
    def _init_db(self):
        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                name TEXT,
                password_hash TEXT,
                created_at TEXT,
                is_active INTEGER
            )
        """)
    
    def save(self, user: User) -> None:
        self._conn.execute(
            "INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)",
            (user.id, user.email, user.name, user.password_hash,
             user.created_at.isoformat(), int(user.is_active))
        )
        self._conn.commit()
    
    def find_by_email(self, email: str) -> Optional[User]:
        cursor = self._conn.execute(
            "SELECT * FROM users WHERE email = ?", (email,)
        )
        row = cursor.fetchone()
        if row:
            return User(
                id=row[0], email=row[1], name=row[2],
                password_hash=row[3], created_at=row[4], is_active=bool(row[5])
            )
        return None
```

### Frameworks & Drivers

- Web frameworks (Flask, FastAPI, Django)
- Database drivers
- External APIs
- UI frameworks

```python
# main.py - Composition Root
from interface_adapters.controllers.user_controller import UserController
from interface_adapters.gateways.sql_user_repository import SQLUserRepository
from interface_adapters.gateways.bcrypt_hasher import BCryptHasher
from application.use_cases.register_user import RegisterUserUseCase
from flask import Flask

def create_app() -> Flask:
    app = Flask(__name__)
    
    # Dependencies
    user_repo = SQLUserRepository("users.db")
    password_hasher = BCryptHasher()
    register_use_case = RegisterUserUseCase(user_repo, password_hasher)
    user_controller = UserController(register_use_case)
    
    # Routes
    app.add_url_rule(
        "/register",
        view_func=user_controller.register,
        methods=["POST"]
    )
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run()
```

## Dependency Injection

```python
# dependency_injection.py
from typing import TypeVar, Dict, Type
import inspect

T = TypeVar('T')

class Container:
    def __init__(self):
        self._services: Dict[Type, object] = {}
        self._factories: Dict[Type, callable] = {}
    
    def register(self, interface: Type[T], implementation: Type[T]) -> None:
        self._services[interface] = implementation
    
    def register_factory(self, interface: Type[T], factory: callable) -> None:
        self._factories[interface] = factory
    
    def resolve(self, interface: Type[T]) -> T:
        if interface in self._services:
            return self._services[interface]
        
        if interface in self._factories:
            return self._factories[interface]()
        
        # Auto-wire
        return self._auto_wire(interface)
    
    def _auto_wire(self, cls: Type[T]) -> T:
        sig = inspect.signature(cls.__init__)
        kwargs = {}
        for param_name, param in sig.parameters.items():
            if param_name == "self":
                continue
            if param.annotation != inspect.Parameter.empty:
                kwargs[param_name] = self.resolve(param.annotation)
        return cls(**kwargs)

# Usage
container = Container()
container.register(UserRepository, SQLUserRepository)
container.register(PasswordHasher, BCryptHasher)

use_case = container.resolve(RegisterUserUseCase)
```

## Testing

```python
# tests/application/test_register_user.py
import pytest
from unittest.mock import Mock

from application.use_cases.register_user import (
    RegisterUserUseCase, RegisterUserRequest, UserRepository, PasswordHasher
)
from domain.entities.user import User

class TestRegisterUser:
    def test_success(self):
        # Arrange
        mock_repo = Mock(spec=UserRepository)
        mock_repo.find_by_email.return_value = None
        
        mock_hasher = Mock(spec=PasswordHasher)
        mock_hasher.hash.return_value = "hashed_password"
        
        use_case = RegisterUserUseCase(mock_repo, mock_hasher)
        request = RegisterUserRequest(
            email="test@example.com",
            name="Test User",
            password="password123"
        )
        
        # Act
        response = use_case.execute(request)
        
        # Assert
        assert response.success is True
        assert response.user_id != ""
        mock_repo.save.assert_called_once()
        
        saved_user = mock_repo.save.call_args[0][0]
        assert saved_user.email == "test@example.com"
        assert saved_user.password_hash == "hashed_password"
    
    def test_duplicate_email(self):
        mock_repo = Mock(spec=UserRepository)
        mock_repo.find_by_email.return_value = User(
            id="1", email="test@example.com", name="Existing",
            created_at=datetime.now()
        )
        
        use_case = RegisterUserUseCase(mock_repo, Mock())
        response = use_case.execute(RegisterUserRequest(
            email="test@example.com", name="Test", password="pass"
        ))
        
        assert response.success is False
        assert "already registered" in response.error
```

## Project Structure

```
src/
├── domain/
│   ├── entities/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── order.py
│   ├── value_objects/
│   │   ├── email.py
│   │   └── money.py
│   ├── events/
│   │   ├── user_registered.py
│   │   └── order_placed.py
│   └── exceptions/
│       ├── user_not_found.py
│       └── invalid_email.py
│
├── application/
│   ├── use_cases/
│   │   ├── __init__.py
│   │   ├── register_user.py
│   │   ├── place_order.py
│   │   └── get_user.py
│   ├── dto/
│   │   ├── requests.py
│   │   └── responses.py
│   ├── ports/
│   │   ├── repositories.py
│   │   └── services.py
│   └── services/
│       ├── event_publisher.py
│       └── notification_service.py
│
├── interface_adapters/
│   ├── controllers/
│   │   ├── user_controller.py
│   │   └── order_controller.py
│   ├── presenters/
│   │   ├── user_presenter.py
│   │   └── order_presenter.py
│   ├── gateways/
│   │   ├── sql_user_repository.py
│   │   ├── sql_order_repository.py
│   │   ├── bcrypt_hasher.py
│   │   └── email_sender.py
│   └── converters/
│       ├── user_converter.py
│       └── order_converter.py
│
├── frameworks/
│   ├── web/
│   │   ├── flask_app.py
│   │   ├── fastapi_app.py
│   │   └── routes/
│   ├── database/
│   │   ├── migrations/
│   │   └── connection.py
│   └── external/
│       ├── payment_gateway.py
│       └── sms_provider.py
│
└── main.py
    └── composition_root.py
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Testability** | Use cases tested without frameworks |
| **Flexibility** | Swap frameworks (Flask→FastAPI) without changing business logic |
| **Maintainability** | Clear separation of concerns |
| **Independence** | Business rules don't depend on UI/DB |
| **Deployability** | Deploy layers independently |

## Common Mistakes

1. **Anemic Domain Models** - Entities with only getters/setters
2. **Leaking Framework Code** - Importing Flask in use cases
3. **Skipping Interfaces** - Directly using concrete implementations
4. **Over-engineering** - Too many layers for simple apps
5. **Circular Dependencies** - Violating dependency rule

## When to Use

- Complex business logic
- Long-lived applications
- Multiple delivery mechanisms (API, CLI, GUI)
- Team needs clear boundaries
- Testing is important

## When to Avoid

- Simple CRUD apps
- Prototypes/MVPs
- Small teams with simple needs
- Throwaway code