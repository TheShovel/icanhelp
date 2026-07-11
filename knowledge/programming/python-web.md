# Python Web Frameworks (FastAPI, Flask, Django)

## FastAPI

### Basic Setup

```python
# main.py
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from sqlalchemy.orm import Session

app = FastAPI(title="My API", version="1.0.0")

# Models
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

# In-memory DB
fake_db = {}

@app.post("/users/", response_model=User, status_code=201)
def create_user(user: UserCreate):
    if user.email in fake_db:
        raise HTTPException(400, "Email already registered")
    user_id = len(fake_db) + 1
    db_user = User(id=user_id, **user.model_dump(), is_active=True)
    fake_db[user.email] = db_user
    return db_user

@app.get("/users/", response_model=List[User])
def read_users(skip: int = 0, limit: int = 100):
    return list(fake_db.values())[skip:skip+limit]

@app.get("/users/{user_id}", response_model=User)
def read_user(user_id: int):
    for user in fake_db.values():
        if user.id == user_id:
            return user
    raise HTTPException(404, "User not found")

@app.put("/users/{user_id}", response_model=User)
def update_user(user_id: int, user: UserBase):
    for email, db_user in fake_db.items():
        if db_user.id == user_id:
            updated = User(id=user_id, **user.model_dump(), is_active=db_user.is_active)
            fake_db[email] = updated
            return updated
    raise HTTPException(404, "User not found")

@app.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int):
    for email, db_user in list(fake_db.items()):
        if db_user.id == user_id:
            del fake_db[email]
            return
    raise HTTPException(404, "User not found")
```

### Dependency Injection

```python
from fastapi import Depends, Header, HTTPException
from typing import Annotated

async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(401, "Not authenticated")
    # Validate token, return user
    return user

@app.get("/me")
async def read_me(current_user: User = Depends(get_current_user)):
    return current_user
```

### Path/Query Parameters

```python
@app.get("/items/{item_id}")
async def read_item(
    item_id: int,                    # Path parameter
    q: str | None = None,            # Query parameter
    short: bool = False,             # Query with default
    limit: int = 10,                 # Query with validation
):
    item = {"item_id": item_id}
    if q:
        item["q"] = q
    if not short:
        item["description"] = "Long description"
    return item

# Validation
from fastapi import Path, Query

@app.get("/items/{item_id}")
async def read_item(
    item_id: Annotated[int, Path(gt=0, le=1000)],
    q: Annotated[str | None, Query(min_length=3, max_length=50)] = None,
):
    return {"item_id": item_id, "q": q}
```

### Request Body

```python
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional
from enum import Enum

class Item(BaseModel):
    name: str
    description: Optional[str] = Field(None, max_length=300)
    price: float = Field(gt=0)
    tax: Optional[float] = None
    tags: list[str] = []

class ItemResponse(Item):
    id: int
    price_with_tax: float

@app.post("/items/", response_model=ItemResponse)
async def create_item(item: Item):
    price_with_tax = item.price + (item.tax or 0)
    return ItemResponse(id=1, price_with_tax=price_with_tax, **item.model_dump())
```

### Background Tasks

```python
from fastapi import BackgroundTasks

def write_log(message: str):
    with open("log.txt", "a") as f:
        f.write(f"{message}\n")

@app.post("/send-notification/{email}")
async def send_notification(email: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(write_log, f"Notification sent to {email}")
    return {"message": "Notification queued"}
```

### Middleware

```python
from fastapi import Request
import time

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

### CORS

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Testing

```python
from fastapi.testclient import TestClient

client = TestClient(app)

def test_create_user():
    response = client.post(
        "/users/",
        json={"email": "test@example.com", "name": "Test", "password": "secret"}
    )
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"

def test_read_users():
    response = client.get("/users/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

---

## Flask

### Basic Setup

```python
# app.py
from flask import Flask, request, jsonify, g
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(80), nullable=False)
    password_hash = db.Column(db.String(128))

@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email exists'}), 400
    
    user = User(email=data['email'], name=data['name'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@app.route('/users', methods=['GET'])
def list_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@app.route('/users/<int:id>', methods=['GET'])
def get_user(id):
    user = User.query.get_or_404(id)
    return jsonify(user.to_dict())

@app.route('/users/<int:id>', methods=['PUT'])
def update_user(id):
    user = User.query.get_or_404(id)
    data = request.get_json()
    user.email = data.get('email', user.email)
    user.name = data.get('name', user.name)
    db.session.commit()
    return jsonify(user.to_dict())

@app.route('/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()
    return '', 204
```

### Blueprints

```python
# users/views.py
from flask import Blueprint, request, jsonify

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/', methods=['GET'])
def list_users():
    ...

# app.py
from users.views import users_bp
app.register_blueprint(users_bp)
```

### Extensions

```python
# extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()
```

```python
# create_app.py
def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app)
    
    from users.views import users_bp
    app.register_blueprint(users_bp)
    
    return app
```

### Authentication (JWT)

```python
from flask_jwt_extended import (
    JWTManager, create_access_token, 
    jwt_required, get_jwt_identity
)

@users_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token)
    return jsonify({'error': 'Invalid credentials'}), 401

@users_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())
```

### Testing

```python
import pytest
from app import create_app, db

@pytest.fixture
def client():
    app = create_app('testing')
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client
        with app.app_context():
            db.drop_all()

def test_create_user(client):
    response = client.post('/api/users', json={
        'email': 'test@example.com',
        'name': 'Test',
        'password': 'secret'
    })
    assert response.status_code == 201
    assert response.json['email'] == 'test@example.com'
```

---

## Django

### Basic Setup

```python
# settings.py
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'myapp',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ...
]

CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
```

### Models

```python
# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)

class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Order(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Serializers

```python
# serializers.py
from rest_framework import serializers
from .models import User, Product, Order

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['user', 'total', 'status', 'created_at']
```

### Views

```python
# views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Product, Order, OrderItem
from .serializers import ProductSerializer, OrderSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        with transaction.atomic():
            order = serializer.save(user=self.request.user)
            # Calculate total from items
            total = sum(item.product.price * item.quantity for item in order.items.all())
            order.total = total
            order.save()
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        order = self.get_object()
        if order.status != 'draft':
            return Response({'error': 'Order not in draft state'}, status=400)
        order.status = 'confirmed'
        order.save()
        return Response(OrderSerializer(order).data)
```

### URLs

```python
# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, OrderViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth/', include('rest_framework.urls')),
]
```

### Custom Permissions

```python
# permissions.py
from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

# In view
class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOwner]
```

### Testing

```python
# tests.py
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import Product, Order

User = get_user_model()

class OrderTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass')
        self.client.force_authenticate(user=self.user)
        self.product = Product.objects.create(name='Test', price=10.00, stock=100)
    
    def test_create_order(self):
        response = self.client.post('/api/orders/', {
            'items': [{'product': self.product.id, 'quantity': 2}]
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['total'], '20.00')
```

---

## Comparison

| Feature | FastAPI | Flask | Django |
|---------|---------|-------|--------|
| **Type** | Modern, async | Microframework | Full-stack |
| **Async** | Native | Via extensions | 4.1+ native |
| **Validation** | Pydantic (auto) | Manual/extensions | Serializers |
| **Admin** | None | None | Built-in |
| **ORM** | SQLAlchemy/Tortoise | SQLAlchemy | Django ORM |
| **Auth** | DI + JWT | Extensions | Built-in + DRF |
| **Learning curve** | Low | Low | Medium |
| **Performance** | High | Medium | Medium |
| **Best for** | APIs, microservices | Small apps, prototypes | Full apps, admin |

---

## Deployment

### Docker (FastAPI)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker (Django)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput
CMD ["gunicorn", "myproject.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp
    depends_on:
      - db
  
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```