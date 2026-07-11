# Domain-Driven Design (DDD)

## Core Concepts

### Ubiquitous Language
Shared language between developers and domain experts, reflected in code.

```python
# Bad: Technical language
class UserManager:
    def create_user_record(self, data): ...

# Good: Domain language
class CustomerRegistration:
    def register_new_customer(self, registration_details): ...
```

### Bounded Contexts
Explicit boundaries where a particular model applies.

```
┌─────────────────┐     ┌─────────────────┐
│   Sales         │     │   Shipping      │
│   Context       │     │   Context       │
│                 │     │                 │
│ Customer        │     │ Delivery        │
│ Order           │────▶│ Address         │
│ Product         │     │ Shipment        │
└─────────────────┘     └─────────────────┘
       │                        │
       ▼                        ▼
   Customer ≠            Customer =
   Delivery              Delivery
```

### Context Mapping
Relationships between bounded contexts:

| Pattern | Description |
|---------|-------------|
| **Shared Kernel** | Shared subset of domain model |
| **Customer/Supplier** | Upstream/downstream relationship |
| **Conformist** | Downstream conforms to upstream |
| **Anticorruption Layer** | Translation layer |
| **Separate Ways** | No integration |
| **Open Host Service** | Public API for integration |
| **Published Language** | Well-defined shared protocol |

## Strategic Design

### Domain Events
Capture important business occurrences.

```python
from dataclasses import dataclass
from datetime import datetime
from typing import List
import uuid

@dataclass
class DomainEvent:
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    occurred_at: datetime = field(default_factory=datetime.now)

@dataclass
class CustomerRegistered(DomainEvent):
    customer_id: str
    email: str
    name: str

@dataclass
class OrderPlaced(DomainEvent):
    order_id: str
    customer_id: str
    total_amount: float
    items: List[dict]

# Entity publishes events
class Customer:
    def __init__(self):
        self._events: List[DomainEvent] = []
    
    def register(self, email: str, name: str) -> None:
        self.email = email
        self.name = name
        self._events.append(CustomerRegistered(
            customer_id=self.id,
            email=email,
            name=name
        ))
    
    def get_events(self) -> List[DomainEvent]:
        events = self._events.copy()
        self._events.clear()
        return events
```

## Tactical Design

### Entities
Objects with identity that persists over time.

```python
from dataclasses import dataclass, field
from typing import Optional
import uuid

@dataclass
class Entity:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    def __eq__(self, other):
        if not isinstance(other, Entity):
            return False
        return self.id == other.id
    
    def __hash__(self):
        return hash(self.id)

@dataclass
class Order(Entity):
    customer_id: str
    status: str = "draft"
    items: list = field(default_factory=list)
    total: float = 0.0
    
    def add_item(self, product_id: str, quantity: int, price: float) -> None:
        if self.status != "draft":
            raise ValueError("Cannot modify confirmed order")
        self.items.append({
            "product_id": product_id,
            "quantity": quantity,
            "price": price
        })
        self.total += quantity * price
    
    def confirm(self) -> None:
        if not self.items:
            raise ValueError("Cannot confirm empty order")
        self.status = "confirmed"
```

### Value Objects
Immutable objects defined by their attributes.

```python
from dataclasses import dataclass
import re

@dataclass(frozen=True)
class Email:
    value: str
    
    def __post_init__(self):
        if not self._is_valid(self.value):
            raise ValueError(f"Invalid email: {self.value}")
    
    @staticmethod
    def _is_valid(email: str) -> bool:
        pattern = r'^[^@]+@[^@]+\.[^@]+$'
        return bool(re.match(pattern, email))
    
    def __str__(self):
        return self.value

@dataclass(frozen=True)
class Money:
    amount: float
    currency: str = "USD"
    
    def __post_init__(self):
        if self.amount < 0:
            raise ValueError("Amount cannot be negative")
        if len(self.currency) != 3:
            raise ValueError("Invalid currency code")
    
    def add(self, other: 'Money') -> 'Money':
        if self.currency != other.currency:
            raise ValueError("Currency mismatch")
        return Money(self.amount + other.amount, self.currency)
    
    def multiply(self, factor: int) -> 'Money':
        return Money(self.amount * factor, self.currency)

@dataclass(frozen=True)
class Address:
    street: str
    city: str
    state: str
    zip_code: str
    country: str
```

### Aggregates
Cluster of entities/values treated as a unit.

```python
# Aggregate Root
class Order(Entity):
    def __init__(self, customer_id: str):
        super().__init__()
        self.customer_id = customer_id
        self.status = "draft"
        self._items: List[OrderItem] = []
        self._events: List[DomainEvent] = []
    
    @property
    def items(self) -> List[OrderItem]:
        return self._items.copy()
    
    def add_item(self, product_id: str, quantity: int, price: Money) -> None:
        if self.status != "draft":
            raise InvalidOperation("Order not in draft state")
        
        # Check invariant: max 10 items per order
        if len(self._items) >= 10:
            raise InvariantViolation("Maximum items reached")
        
        item = OrderItem(product_id, quantity, price)
        self._items.append(item)
        self._recalculate_total()
    
    def remove_item(self, product_id: str) -> None:
        if self.status != "draft":
            raise InvalidOperation("Order not in draft state")
        self._items = [i for i in self._items if i.product_id != product_id]
        self._recalculate_total()
    
    def confirm(self) -> None:
        if not self._items:
            raise InvariantViolation("Empty order cannot be confirmed")
        self.status = "confirmed"
        self._events.append(OrderConfirmed(
            order_id=self.id,
            customer_id=self.customer_id,
            total=self.total
        ))
    
    def _recalculate_total(self) -> None:
        self.total = sum(item.subtotal for item in self._items)
    
    def get_events(self) -> List[DomainEvent]:
        events = self._events.copy()
        self._events.clear()
        return events

# Internal Entity (part of aggregate)
@dataclass
class OrderItem:
    product_id: str
    quantity: int
    price: Money
    
    @property
    def subtotal(self) -> Money:
        return self.price.multiply(self.quantity)
```

### Repositories
Encapsulate persistence logic for aggregates.

```python
from abc import ABC, abstractmethod
from typing import Optional, List

class OrderRepository(ABC):
    @abstractmethod
    def save(self, order: Order) -> None: pass
    
    @abstractmethod
    def find_by_id(self, order_id: str) -> Optional[Order]: pass
    
    @abstractmethod
    def find_by_customer(self, customer_id: str) -> List[Order]: pass
    
    @abstractmethod
    def find_pending(self) -> List[Order]: pass
```

```python
# Implementation
class SQLOrderRepository(OrderRepository):
    def __init__(self, session: 'Session'):
        self._session = session
    
    def save(self, order: Order) -> None:
        # Save aggregate root
        self._session.merge(OrderModel(
            id=order.id,
            customer_id=order.customer_id,
            status=order.status,
            total=order.total.amount
        ))
        
        # Save items (delete + insert for simplicity)
        self._session.query(OrderItemModel).filter(
            OrderItemModel.order_id == order.id
        ).delete()
        
        for item in order.items:
            self._session.add(OrderItemModel(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.price.amount
            ))
        
        self._session.commit()
        
        # Publish events
        for event in order.get_events():
            event_publisher.publish(event)
    
    def find_by_id(self, order_id: str) -> Optional[Order]:
        model = self._session.query(OrderModel).get(order_id)
        if not model:
            return None
        return self._to_domain(model)
    
    def _to_domain(self, model: OrderModel) -> Order:
        order = Order(model.customer_id)
        order.id = model.id
        order.status = model.status
        order.total = Money(model.total, "USD")
        
        for item_model in model.items:
            order._items.append(OrderItem(
                product_id=item_model.product_id,
                quantity=item_model.quantity,
                price=Money(item_model.price, "USD")
            ))
        return order
```

### Domain Services
Stateless operations that don't belong to a single entity.

```python
class PricingService:
    def __init__(self, discount_repo: DiscountRepository):
        self._discount_repo = discount_repo
    
    def calculate_price(self, product: Product, quantity: int, 
                       customer: Customer) -> Money:
        base_price = product.price.multiply(quantity)
        
        # Volume discount
        if quantity >= 100:
            base_price = base_price.multiply(0.9)
        elif quantity >= 50:
            base_price = base_price.multiply(0.95)
        
        # Customer loyalty discount
        discount = self._discount_repo.find_for_customer(customer.id)
        if discount:
            base_price = base_price.multiply(1 - discount.percentage / 100)
        
        return base_price
```

### Factories
Encapsulate complex creation logic.

```python
class OrderFactory:
    def __init__(self, pricing_service: PricingService,
                 inventory_service: InventoryService):
        self._pricing = pricing_service
        self._inventory = inventory_service
    
    def create_order(self, customer: Customer, 
                     items: List[OrderItemData]) -> Order:
        order = Order(customer.id)
        
        for item_data in items:
            # Check inventory
            if not self._inventory.is_available(item_data.product_id, 
                                                 item_data.quantity):
                raise OutOfStockError(item_data.product_id)
            
            # Get price
            product = self._inventory.get_product(item_data.product_id)
            price = self._pricing.calculate_price(
                product, item_data.quantity, customer
            )
            
            order.add_item(item_data.product_id, 
                          item_data.quantity, price)
        
        return order
```

## Application Services (Use Cases)

```python
class PlaceOrderUseCase:
    def __init__(
        self,
        order_repo: OrderRepository,
        customer_repo: CustomerRepository,
        order_factory: OrderFactory,
        event_publisher: EventPublisher
    ):
        self._order_repo = order_repo
        self._customer_repo = customer_repo
        self._order_factory = order_factory
        self._event_publisher = event_publisher
    
    def execute(self, command: PlaceOrderCommand) -> OrderResult:
        # Get customer
        customer = self._customer_repo.find_by_id(command.customer_id)
        if not customer:
            raise CustomerNotFoundError(command.customer_id)
        
        # Create order
        order = self._order_factory.create_order(
            customer, command.items
        )
        
        # Confirm (triggers domain events)
        order.confirm()
        
        # Save
        self._order_repo.save(order)
        
        # Publish events
        for event in order.get_events():
            self._event_publisher.publish(event)
        
        return OrderResult(order_id=order.id, status=order.status)
```

## Modules/Package Structure

```
src/
├── shared/
│   ├── kernel/
│   │   ├── entity.py
│   │   ├── value_object.py
│   │   ├── domain_event.py
│   │   └── repository.py
│   └── exceptions/
│       ├── not_found.py
│       └── invariant_violation.py
│
├── sales/
│   ├── domain/
│   │   ├── order.py
│   │   ├── order_item.py
│   │   ├── customer.py
│   │   ├── product.py
│   │   ├── events/
│   │   │   ├── order_placed.py
│   │   │   └── order_confirmed.py
│   │   ├── services/
│   │   │   └── pricing_service.py
│   │   └── repositories/
│   │       └── order_repository.py
│   ├── application/
│   │   ├── commands/
│   │   │   ├── place_order.py
│   │   │   └── cancel_order.py
│   │   ├── queries/
│   │   │   └── get_order.py
│   │   └── use_cases/
│   │       ├── place_order_handler.py
│   │       └── cancel_order_handler.py
│   └── infrastructure/
│       ├── persistence/
│       │   ├── sql_order_repository.py
│       │   └── orm_models.py
│       └── messaging/
│           └── event_publisher.py
│
└── shipping/
    ├── domain/
    │   ├── shipment.py
    │   └── delivery_address.py
    └── ...
```

## Testing

### Domain Unit Tests

```python
class TestOrder:
    def test_add_item_calculates_total(self):
        order = Order("customer-1")
        order.add_item("product-1", 2, Money(10.00))
        order.add_item("product-2", 1, Money(25.00))
        
        assert order.total == Money(45.00)
    
    def test_confirm_empty_order_raises(self):
        order = Order("customer-1")
        
        with pytest.raises(InvariantViolation):
            order.confirm()
    
    def test_confirmed_order_cannot_be_modified(self):
        order = Order("customer-1")
        order.add_item("product-1", 1, Money(10.00))
        order.confirm()
        
        with pytest.raises(InvalidOperation):
            order.add_item("product-2", 1, Money(20.00))
    
    def test_order_publishes_event_on_confirm(self):
        order = Order("customer-1")
        order.add_item("product-1", 1, Money(10.00))
        order.confirm()
        
        events = order.get_events()
        assert len(events) == 1
        assert isinstance(events[0], OrderConfirmed)
        assert events[0].order_id == order.id
```

### Integration Tests

```python
class TestOrderRepository:
    @pytest.fixture
    def repo(self, db_session):
        return SQLOrderRepository(db_session)
    
    def test_save_and_find(self, repo):
        order = Order("customer-1")
        order.add_item("product-1", 1, Money(10.00))
        order.confirm()
        
        repo.save(order)
        found = repo.find_by_id(order.id)
        
        assert found is not None
        assert found.id == order.id
        assert found.total == order.total
        assert len(found.items) == 1
```

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Anemic domain model | Put behavior in entities |
| Leaking infrastructure | Keep domain pure |
| Over-engineering | Start simple, refactor |
| Wrong aggregate boundaries | Design for consistency |
| Ignoring bounded contexts | Explicit context maps |

## When to Apply DDD

- Complex business logic
- Long-term projects
- Multiple domain experts
- Need for ubiquitous language
- Complex invariants

## When to Avoid

- Simple CRUD applications
- Technical domains (infrastructure, frameworks)
- Short-lived projects
- Teams unfamiliar with DDD