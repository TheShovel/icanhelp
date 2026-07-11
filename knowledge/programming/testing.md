# Software Testing Strategies

## Testing Pyramid

```
         /\
        /  \     E2E Tests (Few)
       /____\    
      /      \   Integration Tests (Some)
     /________\   
    /          \  Unit Tests (Many)
   /____________\
```

### Test Distribution
- **Unit Tests**: 70% - Fast, isolated, deterministic
- **Integration Tests**: 20% - Component interactions
- **E2E Tests**: 10% - Full workflows, slow, brittle

## Unit Testing

### Principles
```python
# Good unit test
def test_calculate_discount():
    # Arrange
    customer = Customer(tier="gold", years_active=5)
    order = Order(total=100.0, items=3)
    
    # Act
    discount = calculate_discount(customer, order)
    
    # Assert
    assert discount == 15.0  # 10% tier + 5% loyalty
```

### Test Structure (AAA Pattern)
```python
def test_user_registration():
    # Arrange
    email = "test@example.com"
    password = "SecurePass123"
    mock_email_service = Mock()
    
    # Act
    user = register_user(email, password, email_service=mock_email_service)
    
    # Assert
    assert user.email == email
    assert user.is_verified == False
    mock_email_service.send_verification.assert_called_once_with(email)
```

### Parameterized Tests
```python
import pytest

@pytest.mark.parametrize("tier,expected_discount", [
    ("bronze", 0),
    ("silver", 5),
    ("gold", 10),
    ("platinum", 15),
])
def test_tier_discount(tier, expected_discount):
    customer = Customer(tier=tier)
    assert calculate_tier_discount(customer) == expected_discount
```

### Test Doubles
```python
# Mock - verify interactions
def test_order_confirmation_sends_email():
    mock_email = Mock()
    order_service = OrderService(email_service=mock_email)
    
    order_service.confirm_order(order_id=123)
    
    mock_email.send.assert_called_once_with(
        to="customer@example.com",
        subject="Order Confirmed",
        template="order_confirmation"
    )

# Stub - provide canned responses
def test_payment_with_stub():
    stub_payment = StubPaymentGateway()
    stub_payment.set_response(success=True, transaction_id="txn_123")
    
    result = process_payment(100.0, gateway=stub_payment)
    assert result.success == True

# Fake - working implementation
class FakeUserRepository:
    def __init__(self):
        self.users = {}
    
    def save(self, user):
        self.users[user.id] = user
    
    def find_by_id(self, id):
        return self.users.get(id)

# Spy - record calls
class SpyLogger:
    def __init__(self):
        self.logged = []
    
    def log(self, level, message):
        self.logged.append((level, message))
```

## Integration Testing

### Database Integration
```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_user_repository(db_session):
    repo = UserRepository(db_session)
    
    user = User(email="test@example.com", name="Test User")
    repo.save(user)
    
    found = repo.find_by_email("test@example.com")
    assert found is not None
    assert found.name == "Test User"
```

### API Integration
```python
import httpx
import pytest

@pytest.fixture
async def api_client():
    async with httpx.AsyncClient(base_url="http://test-api:8000") as client:
        yield client

async def test_create_user(api_client):
    response = await api_client.post("/users", json={
        "email": "test@example.com",
        "name": "Test User"
    })
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    
    # Cleanup
    await api_client.delete(f"/users/{data['id']}")

async def test_user_not_found(api_client):
    response = await api_client.get("/users/999999")
    assert response.status_code == 404
```

### Testcontainers for Real Dependencies
```python
import testcontainers.postgres
import pytest

@pytest.fixture(scope="session")
def postgres_container():
    container = testcontainers.postgres.PostgresContainer("postgres:16")
    container.start()
    yield container
    container.stop()

@pytest.fixture
def db_session(postgres_container):
    engine = create_engine(postgres_container.get_connection_url())
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
```

## Contract Testing

### Consumer-Driven Contracts (Pact)
```python
# consumer_test.py
import pytest
from pact import Consumer, Provider

@pytest.fixture
def pact():
    pact = Consumer("UserService").has_pact_with(
        Provider("OrderService"), 
        pact_dir="./pacts"
    )
    pact.start_service()
    yield pact
    pact.stop_service()

def test_get_orders(pact):
    expected = [
        {"id": 1, "total": 100.0, "status": "completed"},
        {"id": 2, "total": 50.0, "status": "pending"}
    ]
    
    (pact
     .given("orders exist for user")
     .upon_receiving("a request for user orders")
     .with_request("GET", "/users/123/orders")
     .will_respond_with(200, body=expected))
    
    with pact:
        response = requests.get(f"{pact.uri}/users/123/orders")
        assert response.json() == expected
```

```python
# provider_test.py
def test_provider_honors_contract():
    verifier = Verifier(provider="OrderService", provider_base_url="http://localhost:8001")
    
    success = verifier.verify_pacts(
        "./pacts/userservice-orderservice.json",
        provider_states_setup_url="http://localhost:8001/_pact/provider_states"
    )
    assert success
```

## Property-Based Testing

```python
from hypothesis import given, strategies as st

@given(st.lists(st.integers(), min_size=1))
def test_sort_returns_sorted_list(nums):
    sorted_nums = sorted(nums)
    assert sorted_nums == sorted(sorted_nums)
    assert len(sorted_nums) == len(nums)
    assert all(sorted_nums[i] <= sorted_nums[i+1] for i in range(len(sorted_nums)-1))

@given(st.text(min_size=1))
def test_email_validation(text):
    # Test that valid emails pass, invalid fail
    is_valid = validate_email(text)
    if "@" in text and "." in text.split("@")[1]:
        assert is_valid == True
    else:
        assert is_valid == False

# Custom strategies
user_strategy = st.builds(
    User,
    id=st.integers(min_value=1),
    email=st.emails(),
    name=st.text(min_size=1, max_size=50),
    age=st.integers(min_value=13, max_value=120)
)

@given(user_strategy)
def test_user_creation(user):
    assert user.id > 0
    assert "@" in user.email
    assert len(user.name) > 0
```

## End-to-End Testing

### Playwright
```python
# test_e2e.py
from playwright.async_api import async_playwright
import pytest

@pytest.fixture
async def page():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        yield page
        await browser.close()

async def test_user_login(page):
    await page.goto("https://app.example.com/login")
    
    await page.fill('[data-testid="email"]', "user@example.com")
    await page.fill('[data-testid="password"]', "password123")
    await page.click('[data-testid="login-button"]')
    
    await page.wait_for_url("**/dashboard")
    assert await page.is_visible('[data-testid="user-menu"]')

async def test_checkout_flow(page):
    await page.goto("https://app.example.com/products/123")
    await page.click('[data-testid="add-to-cart"]')
    await page.click('[data-testid="cart-icon"]')
    await page.click('[data-testid="checkout-button"]')
    
    await page.fill('[data-testid="email"]', "test@example.com")
    await page.fill('[data-testid="card-number"]', "4242 4242 4242 4242")
    await page.click('[data-testid="pay-button"]')
    
    await page.wait_for_selector('[data-testid="order-confirmed"]')
    assert await page.is_visible('[data-testid="order-number"]')
```

### Cypress
```javascript
// cypress/e2e/checkout.cy.js
describe('Checkout Flow', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'password123')
  })

  it('completes purchase successfully', () => {
    cy.visit('/products/123')
    cy.get('[data-testid="add-to-cart"]').click()
    cy.get('[data-testid="cart-count"]').should('contain', '1')
    
    cy.get('[data-testid="cart-icon"]').click()
    cy.get('[data-testid="checkout-button"]').click()
    
    cy.fillForm({
      email: 'test@example.com',
      cardNumber: '4242 4242 4242 4242',
      expiry: '12/25',
      cvc: '123'
    })
    
    cy.get('[data-testid="pay-button"]').click()
    cy.get('[data-testid="order-confirmed"]').should('be.visible')
  })
})
```

## Test Data Management

```python
# factories.py
import factory
from factory.fuzzy import FuzzyText, FuzzyInteger, FuzzyChoice
from models import User, Order, Product

class UserFactory(factory.Factory):
    class Meta:
        model = User
    
    id = factory.Sequence(lambda n: n)
    email = factory.LazyAttribute(lambda obj: f"user{obj.id}@example.com")
    name = FuzzyText(length=10)
    age = FuzzyInteger(18, 80)
    tier = FuzzyChoice(["bronze", "silver", "gold", "platinum"])
    created_at = factory.Faker("date_time_this_year")

class OrderFactory(factory.Factory):
    class Meta:
        model = Order
    
    id = factory.Sequence(lambda n: n)
    user = factory.SubFactory(UserFactory)
    total = FuzzyFloat(10, 1000)
    status = FuzzyChoice(["pending", "completed", "cancelled"])
    items = factory.List([
        factory.SubFactory("tests.factories.OrderItemFactory")
        for _ in range(3)
    ])

# Usage
def test_order_processing():
    user = UserFactory(tier="gold")
    order = OrderFactory(user=user, total=500.0)
    
    assert order.user.tier == "gold"
    assert order.total == 500.0
```

## Test Organization

```
tests/
├── unit/
│   ├── test_models.py
│   ├── test_services.py
│   └── test_utils.py
├── integration/
│   ├── test_database.py
│   ├── test_api.py
│   └── test_external_services.py
├── contract/
│   ├── test_consumer.py
│   └── test_provider.py
├── e2e/
│   ├── test_auth.py
│   ├── test_checkout.py
│   └── test_admin.py
├── performance/
│   └── test_load.py
├── fixtures/
│   └── factories.py
├── conftest.py
└── pytest.ini
```

```ini
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --strict-markers
    --strict-config
    --tb=short
    --cov=src
    --cov-report=term-missing
    --cov-fail-under=80
markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
    slow: Slow tests
    contract: Contract tests
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r requirements-test.txt
      - name: Run unit tests
        run: pytest tests/unit -m "not slow" --cov=src --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        ports: [5432:5432]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - name: Run integration tests
        run: pytest tests/integration -v

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start services
        run: docker-compose -f docker-compose.test.yml up -d
      - name: Wait for services
        run: sleep 10
      - name: Run E2E tests
        run: pytest tests/e2e -v
      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: test-results/screenshots/

  contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Pact tests
        run: pytest tests/contract -v
```

## Test Quality Metrics

| Metric | Target | Tool |
|--------|--------|------|
| Code Coverage | > 80% | pytest-cov |
| Branch Coverage | > 70% | pytest-cov |
| Mutation Score | > 70% | mutmut |
| Test Duration (unit) | < 10s | pytest |
| Test Duration (integration) | < 60s | pytest |
| Test Duration (E2E) | < 5m | Playwright |
| Flaky Rate | < 1% | pytest-rerunfailures |

## Mutation Testing

```bash
# Install mutmut
pip install mutmut

# Run mutation testing
mutmut run --paths-to-mutate=src/

# View results
mutmut results
mutmut html
```

## Test Maintenance

```python
# Auto-fix flaky tests
@pytest.mark.flaky(reruns=3, reruns_delay=1)
def test_flaky_network_call():
    response = requests.get("https://api.example.com/data")
    assert response.status_code == 200

# Skip slow tests in CI
@pytest.mark.slow
def test_large_dataset_processing():
    # ...

# Conditional skip
@pytest.mark.skipif(sys.version_info < (3, 10), reason="Requires Python 3.10+")
def test_pattern_matching():
    # ...

# Expected failure
@pytest.mark.xfail(reason="Known bug #123")
def test_known_issue():
    assert buggy_function() == expected_result
```

## Debugging Tests

```bash
# Run single test with verbose output
pytest tests/unit/test_user.py::test_user_registration -vvv

# Drop into debugger on failure
pytest --pdb tests/unit/test_user.py

# Show local variables on failure
pytest -l tests/

# Run tests in parallel
pytest -n auto tests/

# Profile test performance
pytest --durations=10 tests/

# Generate HTML report
pytest --html=report.html --self-contained-html tests/
```