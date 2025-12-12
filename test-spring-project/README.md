# Comprehensive Spring Boot 3.4+ Test Project for MCP Tools

## 🎯 Project Overview

A **production-ready Spring Boot 3.4.1 application** built with JDK 21 and Spring Security 6, specifically designed to comprehensively test all 16 MCP (Model Context Protocol) tools.

### Key Statistics
- **Java Files:** 25
- **Lines of Code:** 1,466
- **REST Endpoints:** 14
- **Database Entities:** 4 (with relationships)
- **Service Methods:** 17+
- **Repository Queries:** 15+ (custom + inherited)
- **Validation Rules:** 30+

---

## 📁 Project Structure

```
test-spring-project/
├── src/main/java/com/example/mcptest/
│   ├── McpTestApplication.java               # @SpringBootApplication entry point
│   ├── controller/                            # REST API Layer (14 endpoints)
│   │   ├── UserController.java                # 7 endpoints (CRUD + search)
│   │   ├── ProductController.java             # 4 endpoints
│   │   └── OrderController.java               # 3 endpoints
│   ├── service/                                # Business Logic Layer
│   │   ├── UserService.java                   # Feature flags, validation
│   │   ├── ProductService.java                # Product management
│   │   └── OrderService.java                  # Order processing with relationships
│   ├── repository/                             # Data Access Layer (Spring Data JPA)
│   │   ├── UserRepository.java                # Custom @Query methods
│   │   ├── ProductRepository.java             # Price range, search
│   │   └── OrderRepository.java               # Date ranges, joins
│   ├── domain/                                 # JPA Entities (Fully mapped)
│   │   ├── User.java                          # @Entity, @OneToMany, audit fields
│   │   ├── Product.java                       # Enums, business logic methods
│   │   ├── Order.java                         # Complex relationships
│   │   └── OrderItem.java                     # Join table entity
│   ├── dto/                                    # Data Transfer Objects
│   │   ├── UserDTO.java                       # Comprehensive validation
│   │   ├── ProductDTO.java                    # @Decimal, @Digits validation
│   │   ├── OrderDTO.java                      # Nested validation with @Valid
│   │   └── ApiResponse.java                   # Standardized wrapper
│   ├── security/                               # Spring Security 6 Configuration
│   │   ├── ResourceServerConfig.java          # OAuth2 Resource Server
│   │   ├── JwtAuthenticationFilter.java       # ✅ extends OncePerRequestFilter
│   │   ├── JwtTokenProvider.java              # JWT utility
│   │   └── CustomUserDetailsService.java      # User authentication
│   └── exception/                              # Global Exception Handling
│       ├── GlobalExceptionHandler.java        # @ControllerAdvice
│       ├── ResourceNotFoundException.java     # Custom exceptions
│       └── ResourceAlreadyExistsException.java
├── src/main/resources/
│   └── application.properties                  # Feature flags, DB config
├── pom.xml                                     # Maven dependencies
├── ARCHITECTURE.md                             # ✅ Detailed architecture doc
├── MCP_TEST_SPEC.md                           # ✅ Comprehensive test specs
└── README.md                                   # This file
```

---

## 🚀 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Java** | OpenJDK | 21 |
| **Spring Boot** | Spring Boot | 3.4.1 |
| **Spring Security** | OAuth2 Resource Server | 6.x |
| **Spring Data JPA** | Hibernate | Latest |
| **Database** | H2 (In-Memory) | Latest |
| **Build Tool** | Maven | 3.9+ |
| **Lombok** | Code Generation | Latest |
| **MapStruct** | DTO Mapping | 1.5.5 |
| **JWT** | JJWT | 0.12.3 |

---

## 📊 API Endpoints

### User Management (`/api/users`)
```http
GET    /api/users                    # List all users [ADMIN, USER]
GET    /api/users/{id}               # Get user by ID [ADMIN, USER]
GET    /api/users/username/{name}    # Get by username [ADMIN, USER]
POST   /api/users                    # Create user [ADMIN only]
PUT    /api/users/{id}               # Update user [ADMIN or owner]
DELETE /api/users/{id}               # Delete user [ADMIN only]
GET    /api/users/search?query=      # Search users [ADMIN, USER]
```

### Product Catalog (`/api/products`)
```http
GET    /api/products                 # List all products [Public]
GET    /api/products/{id}            # Get product by ID [Public]
POST   /api/products                 # Create product [ADMIN only]
PUT    /api/products/{id}            # Update product [ADMIN only]
```

### Order Management (`/api/orders`)
```http
GET    /api/orders                   # List all orders [ADMIN only]
GET    /api/orders/{id}              # Get order by ID [USER, ADMIN]
POST   /api/orders                   # Create order [USER, ADMIN]
```

---

## 🔒 Security Features

### Spring Security 6 Configuration
- ✅ **OAuth2 Resource Server** with JWT authentication
- ✅ **Method-level security** with `@PreAuthorize`
- ✅ **Custom AuthenticationFilter** extending `OncePerRequestFilter`
- ✅ **CORS** configuration for localhost:3000, localhost:4200
- ✅ **BCrypt** password encoding
- ✅ **Stateless** session management

### Security Rules
| Path Pattern | Access |
|--------------|--------|
| `/api/auth/**`, `/h2-console/**`, `/actuator/health` | Public |
| `GET /api/products/**` | Public |
| `POST /api/users` | ADMIN only |
| `PUT/DELETE /api/users/**` | ADMIN or owner |
| `/api/orders/**` | USER or ADMIN |
| All other | Authenticated |

---

## 🗄️ Data Model

### Entity Relationships
```
User (1) ──────< (N) Order (1) ──────< (N) OrderItem >────── (1) Product
```

### User Entity
- **Fields:** id, username (unique), email (unique), password, firstName, lastName, active, role
- **Audit:** createdAt, updatedAt (@CreatedDate, @LastModifiedDate)
- **Enums:** UserRole (USER, ADMIN, MODERATOR)
- **Relationships:** One-to-Many with Orders

### Product Entity
- **Fields:** id, sku (unique), name, description, price, stockQuantity, category, available
- **Enums:** ProductCategory (ELECTRONICS, CLOTHING, BOOKS, HOME, SPORTS, OTHER)
- **Business Logic:** isInStock(), decrementStock(), incrementStock()

### Order Entity
- **Fields:** id, orderNumber (unique), user, items, totalAmount, status, orderDate, shippingAddress
- **Enums:** OrderStatus (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- **Business Logic:** calculateTotal(), canBeCancelled()

---

## ✅ Validation Rules

### UserDTO
```java
@NotBlank @Size(3-50) @Pattern username  // Alphanumeric + _ -
@NotBlank @Email @Size(max=100) email
@NotBlank @Size(8-100) @Pattern password // Uppercase + lowercase + digit
@Size(max=50) firstName, lastName
@NotNull active, role
```

### ProductDTO
```java
@NotBlank @Size(max=50) sku
@NotBlank @Size(3-200) name
@NotNull @DecimalMin("0.0") @Digits(10,2) price
@NotNull @Min(0) stockQuantity
@NotNull category
```

### OrderDTO
```java
@NotNull userId
@NotNull @Size(min=1) @Valid items[]
  ├─ @NotNull productId
  └─ @NotNull @Min(1) @Max(100) quantity
```

---

## 🎯 MCP Tool Test Coverage

This project comprehensively tests all **16 MCP tools** across 3 phases:

### Phase 2: Micro Context (5 tools)
✅ **resolve_symbol** - Resolve `userService`, `userRepository` fields
✅ **get_function_definition** - Get `createUser()`, `createOrder()` methods
✅ **get_dto_structure** - Analyze UserDTO, ProductDTO, OrderDTO
✅ **find_mockable_dependencies** - Find UserService, OrderService dependencies
✅ **find_execution_branches** - Analyze `createUser()` branches

### Phase 3: Macro Context (7 tools)
✅ **build_method_call_chain** - Trace UserController → Service → Repository
✅ **trace_endpoint_to_repository** - Follow `/api/users` to database
✅ **find_entity_by_table** - Map `users` → User.java
✅ **analyze_data_flow** - Track UserDTO through layers
✅ **find_transaction_boundaries** - Find @Transactional methods
✅ **detect_circular_dependencies** - Validate service dependencies
✅ **generate_sequence_diagram** - Order creation flow

### Phase 4: Spring Component (4 tools)
✅ **analyze_controller_method** - Analyze POST `/api/users` endpoint
✅ **find_controller_for_endpoint** - Match `/api/products/{id}` to handler
✅ **find_implementations** - Find UserRepository implementations
✅ **find_feature_flag_usage** - Locate `features.new-user-validation`

---

## 📝 Feature Flags

Configured in `application.properties`:

```properties
features.new-user-validation=true   # Enhanced username validation (>=5 chars)
features.enhanced-logging=false      # Verbose logging
features.beta-search=true            # Beta search features
features.premium-features=false      # Premium tier features
```

**Active Usage:**
- `features.new-user-validation` is actively used in `UserService.createUser()`
- Controls whether enhanced validation (5+ char username) is applied
- Demonstrates feature flag branching for MCP tool testing

---

## 🧪 Testing the MCP Tools

### Prerequisites
```bash
# Ensure all packages are built
cd /Users/subhankarhalder/Desktop/Programs/scripts/CodyMcpServers
mvn clean package -f packages/java-parser-service/pom.xml
cd packages/micro-context && npm run build
cd ../macro-context && npm run build
cd ../spring-component && npm run build
```

### Run MCP Tests
```bash
cd /Users/subhankarhalder/Desktop/Programs/scripts/CodyMcpServers
./run-tests.sh test-spring-project
```

### Expected Results
- **Total Tests:** 12+ test cases
- **Target Success Rate:** 100% (all tools working)
- **Test Report:** Generated in `test-reports/test-report-[timestamp].md`

### Detailed Test Specifications
See `MCP_TEST_SPEC.md` for:
- Exact test inputs for each tool
- Expected response format
- Precise assertions to validate
- Test execution plan

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| `README.md` | This file - Project overview |
| `ARCHITECTURE.md` | Detailed architecture, all endpoints, queries, relationships |
| `MCP_TEST_SPEC.md` | Comprehensive MCP tool test specs with assertions |
| `PROJECT_SUMMARY.md` | Implementation progress and status |

---

## 🏗️ Architecture Highlights

### Layered Architecture
```
┌─────────────────────────────────────┐
│   Controller Layer (REST API)       │  @RestController, @RequestMapping
│   - UserController                  │  @Valid, @PreAuthorize
│   - ProductController               │
│   - OrderController                 │
├─────────────────────────────────────┤
│   Service Layer (Business Logic)    │  @Service, @Transactional
│   - UserService                     │  Feature flags, validation
│   - ProductService                  │
│   - OrderService                    │
├─────────────────────────────────────┤
│   Repository Layer (Data Access)    │  @Repository, Spring Data JPA
│   - UserRepository                  │  Custom @Query methods
│   - ProductRepository               │
│   - OrderRepository                 │
├─────────────────────────────────────┤
│   Domain Layer (Entities)           │  @Entity, @Table
│   - User, Product, Order, OrderItem │  JPA relationships, audit
└─────────────────────────────────────┘
```

### Cross-Cutting Concerns
```
┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│   Security     │  │ Exception        │  │  Validation     │
│   @PreAuth     │  │ @ControllerAdv   │  │  @Valid         │
│   JWT Filter   │  │ GlobalHandler    │  │  @NotBlank      │
└────────────────┘  └──────────────────┘  └─────────────────┘
```

---

## ✨ Key Features for MCP Testing

### 1. Comprehensive Annotations
✅ `@SpringBootApplication`, `@Configuration`, `@Bean`
✅ `@RestController`, `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`
✅ `@Service`, `@Repository`, `@Component`
✅ `@Entity`, `@Table`, `@Column`, `@Id`, `@OneToMany`, `@ManyToOne`
✅ `@Valid`, `@NotNull`, `@NotBlank`, `@Email`, `@Pattern`, `@Size`, `@Min`, `@Max`
✅ `@Transactional`, `@Query`
✅ `@ControllerAdvice`, `@ExceptionHandler`
✅ `@PreAuthorize`, `@EnableWebSecurity`, `@EnableMethodSecurity`

### 2. Complex Relationships
✅ One-to-Many (User → Orders)
✅ Many-to-One (Order → User, OrderItem → Product)
✅ Cascade operations, orphan removal
✅ Lazy/Eager fetching strategies

### 3. Business Logic Patterns
✅ Feature flag conditional logic
✅ Multiple validation layers
✅ Transaction boundaries
✅ Exception handling hierarchies
✅ DTO ↔ Entity conversions

### 4. Spring Security 6 Modern Patterns
✅ OAuth2 Resource Server configuration
✅ JWT-based authentication
✅ Custom OncePerRequestFilter implementation
✅ Method-level security
✅ CORS configuration

---

## 🎓 Learning Value

This project demonstrates:
- **Modern Spring Boot 3.4+** best practices
- **Spring Security 6** with OAuth2
- **Clean Architecture** with proper layering
- **Comprehensive validation** strategies
- **Feature flag** implementation
- **Exception handling** with @ControllerAdvice
- **JPA relationships** and custom queries
- **RESTful API** design
- **Production-ready** code quality

---

## 📈 Next Steps

1. ✅ Project created with 25 Java files
2. ✅ Architecture documented
3. ✅ MCP test specifications defined
4. ⏭️ Run MCP test suite
5. ⏭️ Validate all 16 tools
6. ⏭️ Generate test report
7. ⏭️ Fix any failing tests
8. ⏭️ Achieve 100% test success rate

---

## 📞 Support

For MCP tool testing issues, see:
- `MCP_TEST_SPEC.md` for expected test behavior
- `ARCHITECTURE.md` for project structure details
- Test reports in `test-reports/` directory

---

**Built for:** Comprehensive MCP Server Testing
**Version:** 1.0.0
**Last Updated:** 2025-12-12
