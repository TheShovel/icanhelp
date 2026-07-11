# Design Patterns (GoF + Modern)

## Creational Patterns

### Singleton

```python
# Python - Module-level (idiomatic)
# config.py
_config = None

def get_config():
    global _config
    if _config is None:
        _config = load_config()
    return _config
```

```python
# Python - Class-based
class Singleton:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
```

```go
// Go - sync.Once
var (
    instance *Singleton
    once     sync.Once
)

func GetInstance() *Singleton {
    once.Do(func() {
        instance = &Singleton{}
    })
    return instance
}
```

### Factory Method

```python
from abc import ABC, abstractmethod

class Creator(ABC):
    @abstractmethod
    def create_product(self) -> 'Product':
        pass
    
    def use_product(self):
        product = self.create_product()
        return product.operation()

class Product(ABC):
    @abstractmethod
    def operation(self) -> str:
        pass

class ConcreteProductA(Product):
    def operation(self) -> str:
        return "Result A"

class ConcreteCreatorA(Creator):
    def create_product(self) -> Product:
        return ConcreteProductA()
```

```go
// Go - Interface-based
type Product interface {
    Operation() string
}

type Creator interface {
    CreateProduct() Product
    UseProduct() string
}

type ConcreteProductA struct{}
func (p *ConcreteProductA) Operation() string { return "Result A" }

type ConcreteCreatorA struct{}
func (c *ConcreteCreatorA) CreateProduct() Product { return &ConcreteProductA{} }
func (c *ConcreteCreatorA) UseProduct() string { return c.CreateProduct().Operation() }
```

### Abstract Factory

```python
class GUIFactory(ABC):
    @abstractmethod
    def create_button(self) -> 'Button': pass
    @abstractmethod
    def create_checkbox(self) -> 'Checkbox': pass

class WinFactory(GUIFactory):
    def create_button(self) -> Button: return WinButton()
    def create_checkbox(self) -> Checkbox: return WinCheckbox()

class MacFactory(GUIFactory):
    def create_button(self) -> Button: return MacButton()
    def create_checkbox(self) -> Checkbox: return MacCheckbox()
```

### Builder

```python
class Pizza:
    def __init__(self):
        self.size = None
        self.cheese = False
        self.pepperoni = False
        self.mushrooms = False

class PizzaBuilder:
    def __init__(self):
        self.pizza = Pizza()
    
    def size(self, size: str) -> 'PizzaBuilder':
        self.pizza.size = size
        return self
    
    def cheese(self) -> 'PizzaBuilder':
        self.pizza.cheese = True
        return self
    
    def pepperoni(self) -> 'PizzaBuilder':
        self.pizza.pepperoni = True
        return self
    
    def build(self) -> Pizza:
        return self.pizza

# Usage
pizza = PizzaBuilder().size("large").cheese().pepperoni().build()
```

### Prototype

```python
import copy

class Prototype(ABC):
    @abstractmethod
    def clone(self) -> 'Prototype':
        pass

class ConcretePrototype(Prototype):
    def __init__(self, field: str):
        self.field = field
    
    def clone(self) -> 'ConcretePrototype':
        return copy.deepcopy(self)
```

## Structural Patterns

### Adapter

```python
# Target interface
class PaymentProcessor(ABC):
    @abstractmethod
    def pay(self, amount: float) -> bool: pass

# Adaptee
class StripeGateway:
    def charge(self, amount_cents: int) -> dict:
        return {"success": True, "id": "ch_123"}

# Adapter
class StripeAdapter(PaymentProcessor):
    def __init__(self, gateway: StripeGateway):
        self.gateway = gateway
    
    def pay(self, amount: float) -> bool:
        result = self.gateway.charge(int(amount * 100))
        return result["success"]
```

### Decorator

```python
from functools import wraps

class Component(ABC):
    @abstractmethod
    def operation(self) -> str: pass

class ConcreteComponent(Component):
    def operation(self) -> str:
        return "ConcreteComponent"

class Decorator(Component):
    def __init__(self, component: Component):
        self._component = component
    
    def operation(self) -> str:
        return self._component.operation()

class ConcreteDecoratorA(Decorator):
    def operation(self) -> str:
        return f"DecoratorA({self._component.operation()})"

class ConcreteDecoratorB(Decorator):
    def operation(self) -> str:
        return f"DecoratorB({self._component.operation()})"

# Usage
component = ConcreteComponent()
component = ConcreteDecoratorA(component)
component = ConcreteDecoratorB(component)
print(component.operation())  # DecoratorB(DecoratorA(ConcreteComponent))
```

```python
# Functional decorator
def retry(max_attempts: int = 3):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    time.sleep(2 ** attempt)
        return wrapper
    return decorator

@retry(max_attempts=3)
def flaky_operation():
    ...
```

### Facade

```python
class SubsystemA:
    def operation_a(self): print("A")

class SubsystemB:
    def operation_b(self): print("B")

class SubsystemC:
    def operation_c(self): print("C")

class Facade:
    def __init__(self):
        self.a = SubsystemA()
        self.b = SubsystemB()
        self.c = SubsystemC()
    
    def simple_operation(self):
        self.a.operation_a()
        self.b.operation_b()
    
    def complex_operation(self):
        self.a.operation_a()
        self.b.operation_b()
        self.c.operation_c()
```

### Proxy

```python
class Subject(ABC):
    @abstractmethod
    def request(self): pass

class RealSubject(Subject):
    def request(self):
        print("Real request")

class Proxy(Subject):
    def __init__(self):
        self._real = None
    
    def request(self):
        if self._real is None:
            self._real = RealSubject()
        print("Proxy: Logging")
        self._real.request()
        print("Proxy: Caching")
```

### Composite

```python
from abc import ABC, abstractmethod
from typing import List

class Component(ABC):
    @abstractmethod
    def operation(self) -> str: pass
    @abstractmethod
    def add(self, component: 'Component'): pass
    @abstractmethod
    def remove(self, component: 'Component'): pass

class Leaf(Component):
    def __init__(self, name: str):
        self.name = name
    
    def operation(self) -> str:
        return f"Leaf({self.name})"
    
    def add(self, component: Component):
        raise NotImplementedError()
    
    def remove(self, component: Component):
        raise NotImplementedError()

class Composite(Component):
    def __init__(self, name: str):
        self.name = name
        self._children: List[Component] = []
    
    def operation(self) -> str:
        results = [child.operation() for child in self._children]
        return f"Composite({self.name})[{', '.join(results)}]"
    
    def add(self, component: Component):
        self._children.append(component)
    
    def remove(self, component: Component):
        self._children.remove(component)
```

## Behavioral Patterns

### Strategy

```python
from abc import ABC, abstractmethod

class SortStrategy(ABC):
    @abstractmethod
    def sort(self, data: list) -> list: pass

class QuickSort(SortStrategy):
    def sort(self, data: list) -> list:
        return sorted(data)

class MergeSort(SortStrategy):
    def sort(self, data: list) -> list:
        # implementation
        return sorted(data)

class Context:
    def __init__(self, strategy: SortStrategy):
        self._strategy = strategy
    
    def set_strategy(self, strategy: SortStrategy):
        self._strategy = strategy
    
    def execute_sort(self, data: list) -> list:
        return self._strategy.sort(data)

# Usage
ctx = Context(QuickSort())
ctx.execute_sort([3, 1, 4, 1, 5])
ctx.set_strategy(MergeSort())
```

### Observer

```python
from abc import ABC, abstractmethod
from typing import List

class Observer(ABC):
    @abstractmethod
    def update(self, subject: 'Subject'): pass

class Subject(ABC):
    def __init__(self):
        self._observers: List[Observer] = []
    
    def attach(self, observer: Observer):
        self._observers.append(observer)
    
    def detach(self, observer: Observer):
        self._observers.remove(observer)
    
    def notify(self):
        for observer in self._observers:
            observer.update(self)

class ConcreteSubject(Subject):
    def __init__(self):
        super().__init__()
        self._state = 0
    
    @property
    def state(self):
        return self._state
    
    @state.setter
    def state(self, value):
        self._state = value
        self.notify()

class ConcreteObserver(Observer):
    def update(self, subject: Subject):
        if isinstance(subject, ConcreteSubject):
            print(f"State changed to: {subject.state}")
```

```python
# Pythonic observer with callbacks
class EventEmitter:
    def __init__(self):
        self._listeners = {}
    
    def on(self, event: str, callback):
        self._listeners.setdefault(event, []).append(callback)
    
    def off(self, event: str, callback):
        if event in self._listeners:
            self._listeners[event].remove(callback)
    
    def emit(self, event: str, *args, **kwargs):
        for callback in self._listeners.get(event, []):
            callback(*args, **kwargs)

# Usage
emitter = EventEmitter()
emitter.on("data", lambda x: print(f"Received: {x}"))
emitter.emit("data", "hello")
```

### Command

```python
from abc import ABC, abstractmethod

class Command(ABC):
    @abstractmethod
    def execute(self): pass
    @abstractmethod
    def undo(self): pass

class Light:
    def on(self): print("Light ON")
    def off(self): print("Light OFF")

class LightOnCommand(Command):
    def __init__(self, light: Light):
        self.light = light
    
    def execute(self): self.light.on()
    def undo(self): self.light.off()

class LightOffCommand(Command):
    def __init__(self, light: Light):
        self.light = light
    
    def execute(self): self.light.off()
    def undo(self): self.light.on()

class RemoteControl:
    def __init__(self):
        self._commands = {}
        self._history = []
    
    def set_command(self, slot: str, command: Command):
        self._commands[slot] = command
    
    def press(self, slot: str):
        command = self._commands.get(slot)
        if command:
            command.execute()
            self._history.append(command)
    
    def undo(self):
        if self._history:
            self._history.pop().undo()
```

### State

```python
from abc import ABC, abstractmethod

class State(ABC):
    @abstractmethod
    def handle(self, context: 'Context'): pass

class Context:
    def __init__(self):
        self._state: State = ConcreteStateA()
    
    @property
    def state(self) -> State:
        return self._state
    
    @state.setter
    def state(self, state: State):
        print(f"Context: Transition to {type(state).__name__}")
        self._state = state
    
    def request(self):
        self._state.handle(self)

class ConcreteStateA(State):
    def handle(self, context: Context):
        print("StateA handles request")
        context.state = ConcreteStateB()

class ConcreteStateB(State):
    def handle(self, context: Context):
        print("StateB handles request")
        context.state = ConcreteStateA()
```

### Template Method

```python
from abc import ABC, abstractmethod

class DataProcessor(ABC):
    def process(self, data: str) -> str:
        # Template method
        validated = self.validate(data)
        transformed = self.transform(validated)
        saved = self.save(transformed)
        return saved
    
    def validate(self, data: str) -> str:
        if not data:
            raise ValueError("Empty data")
        return data.strip()
    
    @abstractmethod
    def transform(self, data: str) -> str: pass
    
    @abstractmethod
    def save(self, data: str) -> str: pass

class JSONProcessor(DataProcessor):
    def transform(self, data: str) -> str:
        import json
        return json.dumps({"data": data})
    
    def save(self, data: str) -> str:
        with open("output.json", "w") as f:
            f.write(data)
        return "saved to output.json"
```

### Iterator

```python
class Collection:
    def __init__(self, items: list):
        self._items = items
    
    def __iter__(self):
        return CollectionIterator(self._items)

class CollectionIterator:
    def __init__(self, items: list):
        self._items = items
        self._index = 0
    
    def __next__(self):
        if self._index >= len(self._items):
            raise StopIteration
        item = self._items[self._index]
        self._index += 1
        return item

# Pythonic - just implement __iter__
class MyCollection:
    def __init__(self, items):
        self.items = items
    
    def __iter__(self):
        return iter(self.items)
```

## Modern Patterns

### Dependency Injection

```python
from abc import ABC, abstractmethod
from typing import Protocol

class Database(Protocol):
    def query(self, sql: str) -> list: ...

class PostgresDB:
    def query(self, sql: str) -> list:
        return []

class UserService:
    def __init__(self, db: Database):
        self.db = db
    
    def get_users(self) -> list:
        return self.db.query("SELECT * FROM users")

# Composition root
db = PostgresDB()
service = UserService(db)
```

```python
# With injector
import injector

class DatabaseModule(injector.Module):
    def configure(self, binder):
        binder.bind(Database, to=PostgresDB, scope=injector.singleton)

injector = injector.Injector(DatabaseModule())
service = injector.get(UserService)
```

### Repository Pattern

```python
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional

T = TypeVar('T')

class Repository(ABC, Generic[T]):
    @abstractmethod
    def get_by_id(self, id: str) -> Optional[T]: pass
    @abstractmethod
    def save(self, entity: T) -> T: pass
    @abstractmethod
    def delete(self, id: str) -> bool: pass
    @abstractmethod
    def list_all(self) -> list[T]: pass

class UserRepository(Repository[User]):
    def __init__(self, db: Database):
        self.db = db
    
    def get_by_id(self, id: str) -> Optional[User]:
        result = self.db.query("SELECT * FROM users WHERE id = ?", [id])
        return User(*result[0]) if result else None
    
    def save(self, user: User) -> User:
        self.db.query("INSERT INTO users ...", [user.name, user.email])
        return user
```

### Unit of Work

```python
class UnitOfWork:
    def __init__(self, db: Database):
        self.db = db
        self._new = []
        self._dirty = []
        self._deleted = []
    
    def register_new(self, entity):
        self._new.append(entity)
    
    def register_dirty(self, entity):
        self._dirty.append(entity)
    
    def register_deleted(self, entity):
        self._deleted.append(entity)
    
    def commit(self):
        for entity in self._new:
            self.db.insert(entity)
        for entity in self._dirty:
            self.db.update(entity)
        for entity in self._deleted:
            self.db.delete(entity)
        self.db.commit()
        self._new.clear()
        self._dirty.clear()
        self._deleted.clear()
    
    def rollback(self):
        self._new.clear()
        self._dirty.clear()
        self._deleted.clear()
```

### Circuit Breaker

```python
import time
from enum import Enum
from threading import Lock

class State(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = State.CLOSED
        self._lock = Lock()
    
    def call(self, func, *args, **kwargs):
        with self._lock:
            if self.state == State.OPEN:
                if time.time() - self.last_failure_time > self.timeout:
                    self.state = State.HALF_OPEN
                else:
                    raise CircuitOpenError()
        
        try:
            result = func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise
    
    def on_success(self):
        with self._lock:
            self.failure_count = 0
            self.state = State.CLOSED
    
    def on_failure(self):
        with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = State.OPEN
```

### Event Sourcing

```python
from dataclasses import dataclass
from typing import List
from abc import ABC, abstractmethod
import uuid
from datetime import datetime

@dataclass
class Event:
    event_id: str
    event_type: str
    aggregate_id: str
    timestamp: datetime
    data: dict

class Aggregate(ABC):
    def __init__(self, aggregate_id: str):
        self.aggregate_id = aggregate_id
        self._events: List[Event] = []
        self._version = 0
    
    @abstractmethod
    def apply(self, event: Event): pass
    
    def load_from_history(self, events: List[Event]):
        for event in events:
            self.apply(event)
            self._version += 1
    
    def get_uncommitted_events(self) -> List[Event]:
        return self._events
    
    def mark_committed(self):
        self._events.clear()

class Account(Aggregate):
    def __init__(self, account_id: str):
        super().__init__(account_id)
        self.balance = 0
    
    def deposit(self, amount: float):
        event = Event(
            event_id=str(uuid.uuid4()),
            event_type="Deposited",
            aggregate_id=self.aggregate_id,
            timestamp=datetime.now(),
            data={"amount": amount}
        )
        self.apply(event)
        self._events.append(event)
    
    def apply(self, event: Event):
        if event.event_type == "Deposited":
            self.balance += event.data["amount"]
        self._version += 1
```

### CQRS

```python
# Commands
class Command(ABC): pass

@dataclass
class CreateUser(Command):
    user_id: str
    name: str
    email: str

@dataclass
class ChangeEmail(Command):
    user_id: str
    new_email: str

# Events
@dataclass
class UserCreated:
    user_id: str
    name: str
    email: str

@dataclass
class EmailChanged:
    user_id: str
    new_email: str

# Command Handler
class UserCommandHandler:
    def __init__(self, store: EventStore):
        self.store = store
    
    def handle(self, command: Command):
        if isinstance(command, CreateUser):
            self._handle_create(command)
        elif isinstance(command, ChangeEmail):
            self._handle_change_email(command)
    
    def _handle_create(self, cmd: CreateUser):
        events = [UserCreated(cmd.user_id, cmd.name, cmd.email)]
        self.store.save(cmd.user_id, events)
    
    def _handle_change_email(self, cmd: ChangeEmail):
        events = [EmailChanged(cmd.user_id, cmd.new_email)]
        self.store.save(cmd.user_id, events)

# Query Side
class UserReadModel:
    def __init__(self, db: Database):
        self.db = db
    
    def get_user(self, user_id: str) -> dict:
        return self.db.query("SELECT * FROM users_view WHERE id = ?", [user_id])
    
    def list_users(self) -> list:
        return self.db.query("SELECT * FROM users_view")
```

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| God Object | One class does everything | Split by responsibility |
| Singleton Abuse | Global state, hard to test | Dependency Injection |
| Anemic Domain Model | Logic in services, not entities | Rich domain models |
| Primitive Obsession | Using primitives instead of types | Value objects |
| Shotgun Surgery | Change requires many edits | Cohesive modules |
| Copy-Paste Programming | Duplicate code | Extract common logic |

## When to Use Patterns

| Situation | Pattern |
|-----------|---------|
| Create objects without specifying class | Factory Method, Abstract Factory |
| Complex object construction | Builder |
| Add behavior dynamically | Decorator |
| Simplify complex subsystem | Facade |
| Control object access | Proxy |
| Tree structures | Composite |
| Algorithm variation | Strategy |
| State-dependent behavior | State |
| Object notification | Observer |
| Encapsulate requests | Command |
| Sequential algorithms | Template Method |
| Traverse collections | Iterator |
| Decouple abstraction from implementation | Bridge |
| Reduce subclassing | Adapter, Decorator |