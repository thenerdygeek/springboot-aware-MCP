# Spring Boot Test Project - Complete Architecture Documentation

## Project Statistics
- **Total Files**: 25 Java files
- **Total Lines of Code**: 1,466 LOC
- **Package**: `com.example.mcptest`

## Architecture Overview

```
test-spring-project/
├── src/main/java/com/example/mcptest/
│   ├── McpTestApplication.java          # Main @SpringBootApplication
│   ├── controller/                       # REST Controllers Layer
│   │   ├── UserController.java          # 7 endpoints
│   │   ├── ProductController.java       # 4 endpoints
│   │   └── OrderController.java         # 3 endpoints
│   ├── service/                          # Business Logic Layer
│   │   ├── UserService.java             # @Transactional, feature flags
│   │   ├── ProductService.java          # Product management
│   │   └── OrderService.java            # Order processing
│   ├── repository/                       # Data Access Layer
│   │   ├── UserRepository.java          # @Query, custom queries
│   │   ├── ProductRepository.java       # Price range, search
│   │   └── OrderRepository.java         # Date ranges, joins
│   ├── domain/                           # JPA Entities
│   │   ├── User.java                    # @Entity, @OneToMany
│   │   ├── Product.java                 # @Entity, enums
│   │   ├── Order.java                   # @Entity, @ManyToOne
│   │   └── OrderItem.java               # @Entity, join table
│   ├── dto/                              # Data Transfer Objects
│   │   ├── UserDTO.java                 # @Valid, @NotBlank, @Email
│   │   ├── ProductDTO.java              # @DecimalMin, @Digits
│   │   ├── OrderDTO.java                # Nested @Valid
│   │   └── ApiResponse.java             # Response wrapper
│   ├── security/                         # Spring Security 6 Layer
│   │   ├── ResourceServerConfig.java    # @Configuration, OAuth2
│   │   ├── JwtAuthenticationFilter.java # extends OncePerRequestFilter
│   │   ├── JwtTokenProvider.java        # @Component, JWT util
│   │   └── CustomUserDetailsService.java # UserDetailsService
│   └── exception/                        # Exception Handling
│       ├── GlobalExceptionHandler.java  # @ControllerAdvice
│       ├── ResourceNotFoundException.java
│       └── ResourceAlreadyExistsException.java
└── src/main/resources/
    └── application.properties            # App configuration + feature flags
```

## Detailed Component Breakdown

### 1. REST Controllers (14 Total Endpoints)

#### UserController (`/api/users`)
| Method | Endpoint | Description | Request Body | Response | Security |
|--------|----------|-------------|--------------|----------|----------|
| GET | `/api/users` | Get all users | - | `ApiResponse<List<UserDTO>>` | ROLE_USER, ROLE_ADMIN |
| GET | `/api/users/{id}` | Get user by ID | - | `ApiResponse<UserDTO>` | ROLE_USER, ROLE_ADMIN |
| GET | `/api/users/username/{username}` | Get by username | - | `ApiResponse<UserDTO>` | ROLE_USER, ROLE_ADMIN |
| POST | `/api/users` | Create user | `@Valid UserDTO` | `ApiResponse<UserDTO>` | ROLE_ADMIN |
| PUT | `/api/users/{id}` | Update user | `@Valid UserDTO` | `ApiResponse<UserDTO>` | ROLE_ADMIN or owner |
| DELETE | `/api/users/{id}` | Delete user | - | `ApiResponse<Void>` | ROLE_ADMIN |
| GET | `/api/users/search?query=` | Search users | - | `ApiResponse<List<UserDTO>>` | ROLE_USER, ROLE_ADMIN |

#### ProductController (`/api/products`)
| Method | Endpoint | Description | Request Body | Response | Security |
|--------|----------|-------------|--------------|----------|----------|
| GET | `/api/products` | Get all products | - | `ApiResponse<List<ProductDTO>>` | Public |
| GET | `/api/products/{id}` | Get product by ID | - | `ApiResponse<ProductDTO>` | Public |
| POST | `/api/products` | Create product | `@Valid ProductDTO` | `ApiResponse<ProductDTO>` | ROLE_ADMIN |
| PUT | `/api/products/{id}` | Update product | `@Valid ProductDTO` | `ApiResponse<ProductDTO>` | ROLE_ADMIN |

#### OrderController (`/api/orders`)
| Method | Endpoint | Description | Request Body | Response | Security |
|--------|----------|-------------|--------------|----------|----------|
| GET | `/api/orders` | Get all orders | - | `ApiResponse<List<OrderDTO>>` | ROLE_ADMIN |
| GET | `/api/orders/{id}` | Get order by ID | - | `ApiResponse<OrderDTO>` | ROLE_USER, ROLE_ADMIN |
| POST | `/api/orders` | Create order | `@Valid OrderDTO` | `ApiResponse<OrderDTO>` | ROLE_USER, ROLE_ADMIN |

### 2. Service Layer Methods

#### UserService
```java
// Public Methods:
+ List<UserDTO> getAllUsers()
+ UserDTO getUserById(Long id)
+ UserDTO getUserByUsername(String username)
+ UserDTO createUser(UserDTO userDTO)              // @Transactional
+ UserDTO updateUser(Long id, UserDTO userDTO)     // @Transactional
+ void deleteUser(Long id)                         // @Transactional
+ List<UserDTO> searchUsers(String searchTerm)

// Private Methods:
- void validateNewUser(UserDTO userDTO)            // Feature flag dependent
- UserDTO convertToDTO(User user)
- User convertToEntity(UserDTO dto)

// Dependencies:
- UserRepository userRepository
- PasswordEncoder passwordEncoder

// Feature Flags:
- features.new-user-validation (boolean)
```

#### ProductService
```java
+ List<ProductDTO> getAllProducts()
+ ProductDTO getProductById(Long id)
+ ProductDTO createProduct(ProductDTO productDTO)  // @Transactional
+ ProductDTO updateProduct(Long id, ProductDTO productDTO) // @Transactional
```

#### OrderService
```java
+ List<OrderDTO> getAllOrders()
+ OrderDTO getOrderById(Long id)
+ OrderDTO createOrder(OrderDTO orderDTO)          // @Transactional
```

### 3. Domain Model Relationships

```
User (1) ----< (N) Order (1) ----< (N) OrderItem >---- (1) Product
```

**User Entity:**
- Fields: id, username, email, password, firstName, lastName, active, role
- Relationships: `@OneToMany` orders
- Enums: UserRole (USER, ADMIN, MODERATOR)
- Audit: createdAt, updatedAt

**Product Entity:**
- Fields: id, sku, name, description, price, stockQuantity, category, available
- Enums: ProductCategory (ELECTRONICS, CLOTHING, BOOKS, HOME, SPORTS, OTHER)
- Business Logic: `isInStock()`, `decrementStock()`, `incrementStock()`

**Order Entity:**
- Fields: id, orderNumber, user, items, totalAmount, status, orderDate, shippingAddress
- Relationships: `@ManyToOne` user, `@OneToMany` items
- Enums: OrderStatus (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- Business Logic: `calculateTotal()`, `canBeCancelled()`

**OrderItem Entity:**
- Fields: id, order, product, quantity, price
- Relationships: `@ManyToOne` order, `@ManyToOne` product

### 4. Validation Rules

#### UserDTO Validation
```java
@NotBlank username (3-50 chars, alphanumeric + _ -)
@Email email (max 100 chars)
@NotBlank password (8-100 chars, requires uppercase, lowercase, digit)
@Size firstName (max 50 chars)
@Size lastName (max 50 chars)
@NotNull active
@NotNull role
```

#### ProductDTO Validation
```java
@NotBlank sku (max 50 chars)
@NotBlank name (3-200 chars)
@Size description (max 1000 chars)
@NotNull @DecimalMin("0.0") price (10 digits, 2 decimals)
@NotNull @Min(0) stockQuantity
@NotNull category
```

#### OrderDTO Validation
```java
@NotNull userId
@NotNull @Size(min=1) @Valid items
@Size shippingAddress (max 500 chars)

OrderItemDTO:
  @NotNull productId
  @NotNull @Min(1) @Max(100) quantity
```

### 5. Security Configuration

**ResourceServerConfig:**
- `@Configuration`, `@EnableWebSecurity`, `@EnableMethodSecurity`
- OAuth2 Resource Server with JWT
- Session: STATELESS
- CORS enabled for localhost:3000, localhost:4200
- BCrypt password encoder

**JwtAuthenticationFilter (extends OncePerRequestFilter):**
- Extracts JWT from Authorization header
- Validates token using JwtTokenProvider
- Sets authentication in SecurityContext
- Runs before UsernamePasswordAuthenticationFilter

**Security Rules:**
```
Public: /api/auth/**, /h2-console/**, /actuator/health, GET /api/products/**
ADMIN: POST/PUT/DELETE /api/users/**, POST/PUT /api/products/**
USER: GET /api/users/**, POST /api/orders/**
```

### 6. Exception Handling (@ControllerAdvice)

**GlobalExceptionHandler** handles:
- `ResourceNotFoundException` → 404 NOT_FOUND
- `ResourceAlreadyExistsException` → 409 CONFLICT
- `MethodArgumentNotValidException` → 400 BAD_REQUEST (with field errors)
- `IllegalArgumentException` → 400 BAD_REQUEST
- `Exception` → 500 INTERNAL_SERVER_ERROR

All responses wrapped in `ApiResponse<T>` with:
- success (boolean)
- message (String)
- data (T)
- timestamp (LocalDateTime)
- path (String)

### 7. Repository Queries

**UserRepository:**
```java
Optional<User> findByUsername(String username)
Optional<User> findByEmail(String email)
boolean existsByUsername(String username)
List<User> findByActive(Boolean active)
List<User> searchUsers(String searchTerm)  // @Query with LIKE
Optional<User> findByIdWithOrders(Long id)  // @Query with JOIN FETCH
```

**ProductRepository:**
```java
Optional<Product> findBySku(String sku)
List<Product> findByCategory(ProductCategory category)
List<Product> findAvailableInStock()  // @Query
List<Product> findByPriceRange(BigDecimal min, BigDecimal max)  // @Query
List<Product> searchByName(String searchTerm)  // @Query
```

**OrderRepository:**
```java
Optional<Order> findByOrderNumber(String orderNumber)
List<Order> findByUserId(Long userId)
List<Order> findByUserIdAndStatus(Long userId, OrderStatus status)  // @Query
Optional<Order> findByIdWithItems(Long id)  // @Query with JOIN FETCH
List<Order> findOrdersByDateRange(LocalDateTime start, LocalDateTime end)  // @Query
Long countByUserId(Long userId)  // @Query
```

### 8. Configuration Properties

```properties
# Database
spring.datasource.url=jdbc:h2:mem:testdb
spring.jpa.hibernate.ddl-auto=create-drop

# Security
spring.security.oauth2.resourceserver.jwt.issuer-uri=...
jwt.secret=404E635266556A586E3272357538782F...
jwt.expiration=86400000

# Feature Flags
features.new-user-validation=true
features.enhanced-logging=false
features.beta-search=true
features.premium-features=false

# App Config
app.name=MCP Test Application
app.version=1.0.0
app.max-upload-size=10485760
app.allowed-origins=http://localhost:3000,http://localhost:4200
```

## MCP Tool Test Coverage

This architecture provides comprehensive test coverage for all 16 MCP tools:

### Micro Context (5 tools):
1. **resolve_symbol**: `userService` in UserController, `userRepository` in UserService
2. **get_function_definition**: `createUser()`, `createOrder()`, `updateProduct()`
3. **get_dto_structure**: UserDTO, ProductDTO, OrderDTO (nested)
4. **find_mockable_dependencies**: UserService, ProductService, OrderService
5. **find_execution_branches**: `validateNewUser()`, `canBeCancelled()`

### Macro Context (7 tools):
1. **build_method_call_chain**: UserController → UserService → UserRepository
2. **trace_endpoint_to_repository**: `/api/users` → users table
3. **find_entity_by_table**: `users` → User.java, `products` → Product.java
4. **analyze_data_flow**: UserDTO through createUser flow
5. **find_transaction_boundaries**: @Transactional methods
6. **detect_circular_dependencies**: Service layer
7. **generate_sequence_diagram**: Order creation flow

### Spring Component (4 tools):
1. **analyze_controller_method**: `createUser()`, `createOrder()`
2. **find_controller_for_endpoint**: `/api/users/{id}`, `/api/products`
3. **find_implementations**: UserRepository extends JpaRepository
4. **find_feature_flag_usage**: `features.new-user-validation`

## Next Steps

1. ✅ Architecture documented
2. ⏭️ Create comprehensive MCP tool tests with exact assertions
3. ⏭️ Run tests and validate responses
4. ⏭️ Document test results
