# Go Testing

## Basic Testing

```go
// math_test.go
package math

import "testing"

func TestAdd(t *testing.T) {
	result := Add(2, 3)
	expected := 5
	if result != expected {
		t.Errorf("Add(2, 3) = %d; want %d", result, expected)
	}
}

func TestSubtract(t *testing.T) {
	result := Subtract(5, 3)
	if result != 2 {
		t.Errorf("Subtract(5, 3) = %d; want 2", result)
	}
}
```

## Table-Driven Tests

```go
func TestAdd(t *testing.T) {
	tests := []struct {
		name     string
		a, b     int
		expected int
	}{
		{"positive", 2, 3, 5},
		{"negative", -2, -3, -5},
		{"mixed", -2, 3, 1},
		{"zero", 0, 5, 5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := Add(tt.a, tt.b)
			if result != tt.expected {
				t.Errorf("Add(%d, %d) = %d; want %d", tt.a, tt.b, result, tt.expected)
			}
		})
	}
}
```

## Test Helpers

```go
func TestHelper(t *testing.T) {
	t.Helper() // Marks as helper for better stack traces
	// ...
}

func assertEqual(t *testing.T, got, want interface{}) {
	t.Helper()
	if got != want {
		t.Errorf("got %v, want %v", got, want)
	}
}
```

## Subtests

```go
func TestSuite(t *testing.T) {
	t.Run("Add", func(t *testing.T) {
		assertEqual(t, Add(1, 2), 3)
	})

	t.Run("Subtract", func(t *testing.T) {
		assertEqual(t, Subtract(5, 3), 2)
	})
}
```

## Setup/Teardown

```go
func TestWithSetup(t *testing.T) {
	// Setup
	db := setupDB(t)
	defer teardownDB(db)

	// Test
	result := db.Query("SELECT 1")
	assertEqual(t, result, 1)
}

func setupDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	return db
}

func teardownDB(db *sql.DB) {
	db.Close()
}
```

## TestMain

```go
func TestMain(m *testing.M) {
	// Setup before all tests
	setup()
	
	// Run tests
	code := m.Run()
	
	// Teardown after all tests
	teardown()
	
	os.Exit(code)
}
```

## Mocking

### Interface-Based Mocking

```go
// service.go
type UserStore interface {
	GetUser(id string) (*User, error)
	SaveUser(user *User) error
}

type Service struct {
	store UserStore
}

func (s *Service) GetUser(id string) (*User, error) {
	return s.store.GetUser(id)
}
```

```go
// service_mock.go (manual mock)
type MockStore struct {
	GetUserFunc func(id string) (*User, error)
	SaveUserFunc func(user *User) error
}

func (m *MockStore) GetUser(id string) (*User, error) {
	if m.GetUserFunc != nil {
		return m.GetUserFunc(id)
	}
	return nil, nil
}

func (m *MockStore) SaveUser(user *User) error {
	if m.SaveUserFunc != nil {
		return m.SaveUserFunc(user)
	}
	return nil
}
```

```go
// service_test.go
func TestService_GetUser(t *testing.T) {
	mock := &MockStore{
		GetUserFunc: func(id string) (*User, error) {
			if id == "123" {
				return &User{ID: "123", Name: "Test"}, nil
			}
			return nil, errors.New("not found")
		},
	}

	svc := &Service{store: mock}
	user, err := svc.GetUser("123")

	if err != nil {
		t.Fatal(err)
	}
	if user.Name != "Test" {
		t.Errorf("expected Test, got %s", user.Name)
	}
}
```

### Using testify/mock

```go
import "github.com/stretchr/testify/mock"

type MockStore struct {
	mock.Mock
}

func (m *MockStore) GetUser(id string) (*User, error) {
	args := m.Called(id)
	return args.Get(0).(*User), args.Error(1)
}
```

```go
func TestService_GetUser(t *testing.T) {
	mock := new(MockStore)
	mock.On("GetUser", "123").Return(&User{ID: "123", Name: "Test"}, nil)

	svc := &Service{store: mock}
	user, err := svc.GetUser("123")

	require.NoError(t, err)
	assert.Equal(t, "Test", user.Name)
	mock.AssertExpectations(t)
}
```

### gomock

```go
//go:generate mockgen -destination=mocks/mock_store.go -package=mocks . UserStore

func TestService_GetUser(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mock := mocks.NewMockUserStore(ctrl)
	mock.EXPECT().GetUser("123").Return(&User{ID: "123", Name: "Test"}, nil)

	svc := &Service{store: mock}
	user, err := svc.GetUser("123")

	require.NoError(t, err)
	assert.Equal(t, "Test", user.Name)
}
```

## HTTP Testing

### httptest

```go
func TestHandler(t *testing.T) {
	req := httptest.NewRequest("GET", "/users/123", nil)
	w := httptest.NewRecorder()

	handler(w, req)

	resp := w.Result()
	defer resp.Body.Close()

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	body, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(body), "User 123")
}
```

### Test Server

```go
func TestClient(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"id": "123"}`))
	}))
	defer server.Close()

	client := NewClient(server.URL)
	user, err := client.GetUser("123")

	require.NoError(t, err)
	assert.Equal(t, "123", user.ID)
}
```

## Benchmarking

```go
func BenchmarkAdd(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Add(2, 3)
	}
}

func BenchmarkAddParallel(b *testing.B) {
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			Add(2, 3)
		}
	})
}

func BenchmarkStringConcat(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = "a" + "b" + "c"
	}
}
```

```bash
# Run benchmarks
go test -bench=. -benchmem

# Run specific benchmark
go test -bench=BenchmarkAdd -benchmem

# Run with CPU profile
go test -bench=. -cpuprofile=cpu.prof

# Run with memory profile
go test -bench=. -memprofile=mem.prof
```

## Fuzzing

```go
func FuzzAdd(f *testing.F) {
	f.Add(1, 2)
	f.Add(-1, -2)
	f.Add(0, 0)
	f.Add(100, 200)

	f.Fuzz(func(t *testing.T, a, b int) {
		result := Add(a, b)
		if result != a+b {
			t.Errorf("Add(%d, %d) = %d, want %d", a, b, result, a+b)
		}
	})
}
```

```bash
# Run fuzzing
go test -fuzz=FuzzAdd

# Run for specific time
go test -fuzz=FuzzAdd -fuzztime=30s
```

## Test Coverage

```bash
# Basic coverage
go test -cover

# Coverage profile
go test -coverprofile=coverage.out

# View coverage
go tool cover -html=coverage.out

# Coverage by function
go tool cover -func=coverage.out

# Coverage with packages
go test -coverprofile=coverage.out ./...
```

## Running Tests

```bash
# All tests in package
go test

# All tests in module
go test ./...

# Verbose
go test -v

# Run specific test
go test -run TestAdd

# Run with pattern
go test -run "TestAdd|TestSubtract"

# Run subtest
go test -run "TestSuite/Add"

# Parallel
go test -p 4

# Count (run multiple times)
go test -count=3

# Timeout
go test -timeout 30s

# Fail fast
go test -failfast

# Race detector
go test -race

# Short mode (skip long tests)
go test -short

# List tests
go test -list=.
```

## Testify Assertions

```go
import (
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestWithTestify(t *testing.T) {
	// require stops test on failure
	require.Equal(t, 5, Add(2, 3))
	require.NoError(t, err)

	// assert continues
	assert.Equal(t, "hello", "hello")
	assert.Contains(t, "hello world", "world")
	assert.Nil(t, nil)
	assert.NotNil(t, &struct{}{})
	assert.True(t, true)
	assert.False(t, false)
	assert.Len(t, []int{1, 2, 3}, 3)
	assert.Empty(t, "")
	assert.NotEmpty(t, "a")
	assert.Greater(t, 5, 3)
	assert.Less(t, 3, 5)
	assert.InDelta(t, 0.1+0.2, 0.3, 0.001)
	assert.Panics(t, func() { panic("boom") })
	assert.NotPanics(t, func() {})
}
```

## Test Suites

```go
type UserTestSuite struct {
	suite.Suite
	db *sql.DB
}

func (s *UserTestSuite) SetupSuite() {
	s.db = setupDB(s.T())
}

func (s *UserTestSuite) TearDownSuite() {
	s.db.Close()
}

func (s *UserTestSuite) TestGetUser() {
	user := &User{ID: "1", Name: "Test"}
	s.db.Exec("INSERT INTO users (id, name) VALUES (?, ?)", user.ID, user.Name)

	result := GetUser(s.db, "1")
	s.Equal("Test", result.Name)
}

func TestUserTestSuite(t *testing.T) {
	suite.Run(t, new(UserTestSuite))
}
```

## Integration Testing

```go
// +build integration

package myapp

import (
	"testing"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
)

func TestWithPostgres(t *testing.T) {
	ctx := context.Background()
	
	container, err := postgres.RunContainer(ctx,
		testcontainers.WithImage("postgres:16-alpine"),
	)
	require.NoError(t, err)
	defer container.Terminate(ctx)

	connStr, err := container.ConnectionString(ctx)
	require.NoError(t, err)

	db, err := sql.Open("postgres", connStr)
	require.NoError(t, err)

	// Run tests with real database
}
```

```bash
# Run integration tests
go test -tags=integration ./...
```

## Golden Files

```go
func TestGolden(t *testing.T) {
	result := GenerateOutput()
	
	golden := "testdata/golden.txt"
	
	// Update: go test -update
	if !*updateFlag {
		expected, err := os.ReadFile(golden)
		require.NoError(t, err)
		assert.Equal(t, string(expected), result)
	} else {
		err := os.WriteFile(golden, []byte(result), 0644)
		require.NoError(t, err)
	}
}
```

```bash
# Update golden files
go test -update
```

## Parallel Testing

```go
func TestParallel(t *testing.T) {
	t.Parallel() // Marks as parallel-safe

	// Test code
}

func TestSuite(t *testing.T) {
	t.Run("TestA", func(t *testing.T) {
		t.Parallel()
		// ...
	})
	t.Run("TestB", func(t *testing.T) {
		t.Parallel()
		// ...
	})
}
```

## Test Helpers Packages

```bash
# Install testify
go get github.com/stretchr/testify

# Install gomock
go get github.com/golang/mock/gomock
go install github.com/golang/mock/mockgen@latest

# Install testcontainers
go get github.com/testcontainers/testcontainers-go
```

## Best Practices

1. **Name tests clearly**: `TestFunction_Scenario_ExpectedResult`
2. **Use table-driven tests** for multiple cases
3. **Use `t.Helper()`** in helper functions
4. **Use `require`** for critical assertions, `assert` for others
5. **Test behavior, not implementation**
6. **Use interfaces for mocking**
7. **Run with `-race`** in CI
8. **Keep tests fast** - use `-short` for slow tests
9. **Use subtests** for organization
10. **Test error paths** explicitly
11. **Use golden files** for complex output
12. **Separate unit/integration tests** with build tags
13. **Run benchmarks** for performance-critical code
14. **Use fuzzing** for input validation
15. **Maintain coverage** above 80%