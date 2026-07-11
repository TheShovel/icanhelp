# Hexagonal Architecture (Ports and Adapters)

## Overview

Hexagonal Architecture isolates the core domain from external concerns by defining **ports** (interfaces) and **adapters** (implementations).

```
                    ┌─────────────────┐
                    │   Application   │
                    │     (Core)      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │  Port    │  │  Port    │  │  Port    │
        │ (Driver) │  │ (Driven) │  │ (Driver) │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │             │             │
        ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
        │ Adapter  │  │ Adapter  │  │ Adapter  │
        │ (HTTP)   │  │ (DB)     │  │ (CLI)    │
        └──────────┘  └──────────┘  └──────────┘
```

## Core Concepts

### Ports (Interfaces)

**Driver Ports (Primary/Inbound)** - Called by external actors
```python
# ports/inbound/user_use_case.py
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class RegisterUserCommand:
    email: str
    name: str
    password: str

@dataclass
class UserResult:
    user_id: str
    email: str
    name: str

class UserUseCase(ABC):
    @abstractmethod
    def register_user(self, command: RegisterUserCommand) -> UserResult: pass
    
    @abstractmethod
    def get_user(self, user_id: str) -> UserResult: pass
```

**Driven Ports (Secondary/Outbound)** - Called by application
```python
# ports/outbound/user_repository.py
from abc import ABC, abstractmethod
from typing import Optional

class UserRepository(ABC):
    @abstractmethod
    def save(self, user: 'User') -> None: pass
    
    @abstractmethod
    def find_by_id(self, user_id: str) -> Optional['User']: pass
    
    @abstractmethod
    def find_by_email(self, email: str) -> Optional['User']: pass

class EmailService(ABC):
    @abstractmethod
    def send_welcome_email(self, email: str, name: str) -> None: pass
```

### Domain Model

```python
# domain/user.py
from dataclasses import dataclass, field
from datetime import datetime
import uuid

@dataclass
class User:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    email: str = ""
    name: str = ""
    password_hash: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    is_active: bool = True
    
    @classmethod
    def create(cls, email: str, name: str, password_hash: str) -> 'User':
        if "@" not in email:
            raise ValueError("Invalid email")
        if len(name) < 2:
            raise ValueError("Name too short")
        return cls(email=email, name=name, password_hash=password_hash)
    
    def change_email(self, new_email: str) -> None:
        if "@" not in new_email:
            raise ValueError("Invalid email")
        self.email = new_email
    
    def deactivate(self) -> None:
        self.is_active = False
```

### Application Services (Use Cases)

```python
# application/user_service.py
from ports.inbound.user_use_case import UserUseCase, RegisterUserCommand, UserResult
from ports.outbound.user_repository import UserRepository
from ports.outbound.email_service import EmailService
from domain.user import User

class UserService(UserUseCase):
    def __init__(
        self,
        user_repo: UserRepository,
        email_service: EmailService,
        password_hasher: 'PasswordHasher'
    ):
        self._user_repo = user_repo
        self._email_service = email_service
        self._password_hasher = password_hasher
    
    def register_user(self, command: RegisterUserCommand) -> UserResult:
        # Check duplicate
        if self._user_repo.find_by_email(command.email):
            raise ValueError("Email already exists")
        
        # Create user
        user = User.create(
            email=command.email,
            name=command.name,
            password_hash=self._password_hasher.hash(command.password)
        )
        
        # Save
        self._user_repo.save(user)
        
        # Send email (async in real app)
        self._email_service.send_welcome_email(user.email, user.name)
        
        return UserResult(
            user_id=user.id,
            email=user.email,
            name=user.name
        )
    
    def get_user(self, user_id: str) -> UserResult:
        user = self._user_repo.find_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        return UserResult(
            user_id=user.id,
            email=user.email,
            name=user.name
        )
```

### Adapters (Implementations)

**Driver Adapter - REST API**
```python
# adapters/driven/rest/user_controller.py
from flask import Flask, request, jsonify
from ports.inbound.user_use_case import UserUseCase, RegisterUserCommand, UserResult

app = Flask(__name__)

class UserController:
    def __init__(self, use_case: UserUseCase):
        self._use_case = use_case
    
    def register_routes(self):
        app.add_url_rule(
            "/users", "register_user",
            self.register_user, methods=["POST"]
        )
        app.add_url_rule(
            "/users/<user_id>", "get_user",
            self.get_user, methods=["GET"]
        )
    
    def register_user(self):
        data = request.get_json()
        command = RegisterUserCommand(
            email=data["email"],
            name=data["name"],
            password=data["password"]
        )
        
        try:
            result = self._use_case.register_user(command)
            return jsonify({
                "user_id": result.user_id,
                "email": result.email,
                "name": result.name
            }), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
    
    def get_user(self, user_id: str):
        try:
            result = self._use_case.get_user(user_id)
            return jsonify({
                "user_id": result.user_id,
                "email": result.email,
                "name": result.name
            })
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
```

**Driven Adapter - Database**
```python
# adapters/driven/database/sql_user_repository.py
import sqlite3
from typing import Optional
from ports.outbound.user_repository import UserRepository
from domain.user import User

class SQLUserRepository(UserRepository):
    def __init__(self, db_path: str):
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._init_schema()
    
    def _init_schema(self):
        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1
            )
        """)
        self._conn.commit()
    
    def save(self, user: User) -> None:
        self._conn.execute(
            """INSERT INTO users (id, email, name, password_hash, created_at, is_active)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user.id, user.email, user.name, user.password_hash,
             user.created_at.isoformat(), int(user.is_active))
        )
        self._conn.commit()
    
    def find_by_id(self, user_id: str) -> Optional[User]:
        cursor = self._conn.execute(
            "SELECT * FROM users WHERE id = ?", (user_id,)
        )
        row = cursor.fetchone()
        return self._row_to_user(row) if row else None
    
    def find_by_email(self, email: str) -> Optional[User]:
        cursor = self._conn.execute(
            "SELECT * FROM users WHERE email = ?", (email,)
        )
        row = cursor.fetchone()
        return self._row_to_user(row) if row else None
    
    def _row_to_user(self, row) -> User:
        return User(
            id=row[0], email=row[1], name=row[2],
            password_hash=row[3],
            created_at=datetime.fromisoformat(row[4]),
            is_active=bool(row[5])
        )
```

**Driven Adapter - Email**
```python
# adapters/driven/email/smtp_email_service.py
import smtplib
from email.mime.text import MIMEText
from ports.outbound.email_service import EmailService

class SMTPEmailService(EmailService):
    def __init__(self, host: str, port: int, username: str, password: str):
        self._host = host
        self._port = port
        self._username = username
        self._password = password
    
    def send_welcome_email(self, email: str, name: str) -> None:
        msg = MIMEText(f"Welcome {name}!")
        msg["Subject"] = "Welcome to Our Service"
        msg["From"] = self._username
        msg["To"] = email
        
        with smtplib.SMTP(self._host, self._port) as server:
            server.starttls()
            server.login(self._username, self._password)
            server.send_message(msg)
```

### Composition Root (Main)

```python
# main.py
from adapters.driven.database.sql_user_repository import SQLUserRepository
from adapters.driven.email.smtp_email_service import SMTPEmailService
from adapters.driven.security.bcrypt_hasher import BCryptHasher
from application.user_service import UserService
from adapters.driver.rest.user_controller import UserController

def main():
    # Infrastructure
    user_repo = SQLUserRepository("users.db")
    email_service = SMTPEmailService(
        host="smtp.gmail.com",
        port=587,
        username="app@example.com",
        password="secret"
    )
    password_hasher = BCryptHasher()
    
    # Application
    user_service = UserService(
        user_repo=user_repo,
        email_service=email_service,
        password_hasher=password_hasher
    )
    
    # Driver Adapter
    controller = UserController(user_service)
    controller.register_routes()
    
    # Run
    app.run(host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
```

## Testing

### Unit Test (No Infrastructure)

```python
# tests/application/test_user_service.py
import pytest
from unittest.mock import Mock

from application.user_service import UserService
from ports.inbound.user_use_case import RegisterUserCommand
from ports.outbound.user_repository import UserRepository
from ports.outbound.email_service import EmailService

class TestUserService:
    def setup_method(self):
        self.mock_repo = Mock(spec=UserRepository)
        self.mock_email = Mock(spec=EmailService)
        self.mock_hasher = Mock()
        self.mock_hasher.hash.return_value = "hashed"
        
        self.service = UserService(
            user_repo=self.mock_repo,
            email_service=self.mock_email,
            password_hasher=self.mock_hasher
        )
    
    def test_register_user_success(self):
        self.mock_repo.find_by_email.return_value = None
        
        command = RegisterUserCommand(
            email="test@example.com",
            name="Test User",
            password="password123"
        )
        
        result = self.service.register_user(command)
        
        assert result.email == "test@example.com"
        assert result.name == "Test User"
        self.mock_repo.save.assert_called_once()
        self.mock_email.send_welcome_email.assert_called_once_with(
            "test@example.com", "Test User"
        )
    
    def test_register_user_duplicate_email(self):
        from domain.user import User
        self.mock_repo.find_by_email.return_value = User(
            id="1", email="test@example.com", name="Existing",
            password_hash="hash", created_at=datetime.now()
        )
        
        command = RegisterUserCommand(
            email="test@example.com", name="Test", password="pass"
        )
        
        with pytest.raises(ValueError, match="Email already exists"):
            self.service.register_user(command)
```

### Integration Test (With Real Adapters)

```python
# tests/integration/test_sql_repository.py
import pytest
import tempfile
import os

from adapters.driven.database.sql_user_repository import SQLUserRepository
from domain.user import User

class TestSQLUserRepository:
    def setup_method(self):
        self.db_file = tempfile.NamedTemporaryFile(delete=False).name
        self.repo = SQLUserRepository(self.db_file)
    
    def teardown_method(self):
        os.unlink(self.db_file)
    
    def test_save_and_find(self):
        user = User.create(
            email="test@example.com",
            name="Test",
            password_hash="hash"
        )
        
        self.repo.save(user)
        found = self.repo.find_by_id(user.id)
        
        assert found is not None
        assert found.email == user.email
        assert found.name == user.name
    
    def test_find_by_email(self):
        user = User.create(
            email="test@example.com",
            name="Test",
            password_hash="hash"
        )
        self.repo.save(user)
        
        found = self.repo.find_by_email("test@example.com")
        assert found is not None
        assert found.id == user.id
```

## Dependency Direction

```
┌─────────────────────────────────────────────────────────┐
│                    Application Core                      │
│  ┌──────────────┐    ┌──────────────────────────────┐  │
│  │ Domain Model │    │      Use Cases               │  │
│  │  (Entities)  │◄───│  (Application Services)      │  │
│  └──────────────┘    └──────────────┬───────────────┘  │
└─────────────────────────────────────│────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
            │  Ports      │   │  Ports      │   │  Ports      │
            │ (Inbound)   │   │ (Outbound)  │   │ (Outbound)  │
            └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
                   │                 │                 │
            ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
            │  Adapters   │   │  Adapters   │   │  Adapters   │
            │ (REST API)  │   │ (Database)  │   │ (Email)     │
            └─────────────┘   └─────────────┘   └─────────────┘
```

## Key Differences from Clean Architecture

| Aspect | Clean Architecture | Hexagonal Architecture |
|--------|-------------------|----------------------|
| Focus | Layers | Ports & Adapters |
| Terminology | Entities, Use Cases, Adapters | Domain, Ports, Adapters |
| Symmetry | Asymmetric (inward) | Symmetric (both sides) |
| Driver/Driven | Not explicit | Explicit distinction |

## Benefits

1. **Testability** - Core tested without any infrastructure
2. **Replaceability** - Swap adapters without changing core
3. **Isolation** - Domain has zero external dependencies
4. **Flexibility** - Multiple adapters per port (REST, GraphQL, CLI)
5. **Maintainability** - Clear boundaries

## When to Use

- Complex domains with many external integrations
- Need to support multiple interfaces (API, CLI, messaging)
- Long-lived applications
- Teams practicing DDD

## When to Avoid

- Simple CRUD applications
- Prototypes/MVPs
- Single-interface applications
- Small teams with limited complexity