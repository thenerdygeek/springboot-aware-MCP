# Test Examples with Expected Outputs

This document provides concrete examples for testing each tool with sample Spring Boot code and expected outputs.

---

## Setup: Sample Spring Boot Code

### Sample Entity: User.java
```java
package com.example.demo.entity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    private boolean active;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Order> orders;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    // ... other getters/setters
}
```

### Sample DTO: UserDTO.java
```java
package com.example.demo.dto;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;

public class UserDTO {
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Email must be valid")
    @NotBlank(message = "Email is required")
    private String email;

    private boolean active;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    // ... other getters/setters
}
```

### Sample Repository: UserRepository.java
```java
package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByActiveTrue();
}
```

### Sample Service: UserService.java
```java
package com.example.demo.service;

import com.example.demo.dto.UserDTO;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import javax.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserMapper userMapper;

    public UserDTO findById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
        return userMapper.toDTO(user);
    }

    public List<UserDTO> findAllActive() {
        return userRepository.findByActiveTrue()
            .stream()
            .map(userMapper::toDTO)
            .collect(Collectors.toList());
    }

    public UserDTO createUser(UserDTO userDTO) {
        User user = userMapper.toEntity(userDTO);
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        return userMapper.toDTO(savedUser);
    }
}
```

### Sample Controller: UserController.java
```java
package com.example.demo.controller;

import com.example.demo.dto.UserDTO;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        UserDTO user = userService.findById(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllActiveUsers() {
        List<UserDTO> users = userService.findAllActive();
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserDTO userDTO) {
        UserDTO created = userService.createUser(userDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
```

---

## Phase 2: Micro Context Server Examples

### Example 2.1: get_class_info

**Test Scenario:** Get complete information about the User entity class

**Tool Invocation:**
```json
{
  "tool": "get_class_info",
  "class_name": "User"
}
```

**Expected Output:**
```markdown
# Class Information: User

## Package
com.example.demo.entity

## Class Type
class

## Annotations
- @Entity
- @Table(name = "users")

## Fields

### id
- **Type:** Long
- **Modifiers:** private
- **Annotations:** @Id, @GeneratedValue(strategy = GenerationType.IDENTITY)

### email
- **Type:** String
- **Modifiers:** private
- **Annotations:** @Column(nullable = false, unique = true)

### name
- **Type:** String
- **Modifiers:** private
- **Annotations:** @Column(nullable = false)

### active
- **Type:** boolean
- **Modifiers:** private

### createdAt
- **Type:** LocalDateTime
- **Modifiers:** private
- **Annotations:** @Column(name = "created_at")

### orders
- **Type:** List<Order>
- **Modifiers:** private
- **Annotations:** @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)

## Methods

### getId()
- **Return Type:** Long
- **Modifiers:** public

### setId(Long id)
- **Return Type:** void
- **Modifiers:** public
- **Parameters:** id (Long)

### getEmail()
- **Return Type:** String
- **Modifiers:** public

### setEmail(String email)
- **Return Type:** void
- **Modifiers:** public
- **Parameters:** email (String)

[... other getters/setters ...]

## Summary
- **Total Fields:** 5
- **Total Methods:** 10
- **JPA Entity:** Yes

## File Reference
`/path/to/project/src/main/java/com/example/demo/entity/User.java`

---
Class analysis complete.
```

**Validation Checklist:**
- ✅ All fields listed with correct types
- ✅ JPA annotations captured (@Entity, @Table, @Column)
- ✅ Relationship annotations shown (@OneToMany)
- ✅ All methods listed
- ✅ File path provided

---

### Example 2.2: get_method_body

**Test Scenario:** Get the implementation of UserService.findById method

**Tool Invocation:**
```json
{
  "tool": "get_method_body",
  "class_name": "UserService",
  "method_name": "findById"
}
```

**Expected Output:**
```markdown
# Method Body: UserService.findById

## Method Signature
```java
public UserDTO findById(Long id)
```

## Method Body
```java
public UserDTO findById(Long id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    return userMapper.toDTO(user);
}
```

## Analysis
- **Return Type:** UserDTO
- **Parameters:** id (Long)
- **Modifiers:** public
- **Throws:** EntityNotFoundException (via lambda)

## Method Calls
- userRepository.findById(id)
- userMapper.toDTO(user)

## File Reference
`/path/to/project/src/main/java/com/example/demo/service/UserService.java:18`

---
Method body retrieved.
```

**Validation Checklist:**
- ✅ Complete method signature
- ✅ Full method body with formatting preserved
- ✅ Method calls identified
- ✅ Exception handling noted
- ✅ File location with line number

---

### Example 2.3: get_dto_structure

**Test Scenario:** Analyze UserDTO structure with validation annotations

**Tool Invocation:**
```json
{
  "tool": "get_dto_structure",
  "class_name": "UserDTO",
  "max_depth": 2
}
```

**Expected Output:**
```markdown
# DTO Structure: UserDTO

## Class Information
- **Package:** com.example.demo.dto
- **Type:** class

## Fields (Depth 0)

### id
- **Type:** Long
- **Access:** private
- **Depth:** 0

### name
- **Type:** String
- **Access:** private
- **Depth:** 0
- **Validation:**
  - @NotBlank(message = "Name is required")

### email
- **Type:** String
- **Access:** private
- **Depth:** 0
- **Validation:**
  - @Email(message = "Email must be valid")
  - @NotBlank(message = "Email is required")

### active
- **Type:** boolean
- **Access:** private
- **Depth:** 0

## Validation Summary
- **Total Validation Annotations:** 3
- **Required Fields:** name, email
- **Email Validation:** email

## Field Count
- **Total Fields:** 4
- **Primitive Types:** 2 (Long, boolean)
- **String Types:** 2

## File Reference
`/path/to/project/src/main/java/com/example/demo/dto/UserDTO.java`

---
DTO structure analyzed.
```

**Validation Checklist:**
- ✅ All fields listed with types
- ✅ Validation annotations captured
- ✅ Depth indicators present
- ✅ Summary statistics provided
- ✅ No nested expansion (max_depth would expand nested objects)

---

### Example 2.4: find_mockable_dependencies

**Test Scenario:** Find dependencies to mock for testing UserService

**Tool Invocation:**
```json
{
  "tool": "find_mockable_dependencies",
  "class_name": "UserService"
}
```

**Expected Output:**
```markdown
# Mockable Dependencies: UserService

## Dependencies Found: 2

### Dependency 1: userRepository
- **Type:** UserRepository
- **Injection Type:** Field (Autowired)
- **Annotations:** @Autowired
- **Interface:** Yes
- **Spring Bean:** Yes

**Suggested Mock:**
```java
@Mock
private UserRepository userRepository;
```

### Dependency 2: userMapper
- **Type:** UserMapper
- **Injection Type:** Field (Autowired)
- **Annotations:** @Autowired
- **Interface:** No
- **Spring Bean:** Yes

**Suggested Mock:**
```java
@Mock
private UserMapper userMapper;
```

## Test Setup Template
```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    @Test
    void testFindById() {
        // Arrange
        Long userId = 1L;
        User user = new User();
        UserDTO userDTO = new UserDTO();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userMapper.toDTO(user)).thenReturn(userDTO);

        // Act
        UserDTO result = userService.findById(userId);

        // Assert
        assertNotNull(result);
        verify(userRepository).findById(userId);
        verify(userMapper).toDTO(user);
    }
}
```

## Summary
- **Total Dependencies:** 2
- **All Spring Beans:** Yes
- **Repository Dependencies:** 1
- **Mapper Dependencies:** 1

## File Reference
`/path/to/project/src/main/java/com/example/demo/service/UserService.java`

---
Found 2 mockable dependency/dependencies.
```

**Validation Checklist:**
- ✅ All @Autowired fields found
- ✅ Dependency types identified
- ✅ Mock setup code provided
- ✅ Complete test template included
- ✅ Summary statistics

---

### Example 2.5: find_execution_branches

**Test Scenario:** Find execution branches in UserService.findById

**Tool Invocation:**
```json
{
  "tool": "find_execution_branches",
  "class_name": "UserService",
  "method_name": "findById"
}
```

**Expected Output:**
```markdown
# Execution Branches: UserService.findById

## Method Signature
```java
public UserDTO findById(Long id)
```

## Branch Analysis

### Total Branches: 2

### Branch 1: Happy Path
- **Type:** Normal execution
- **Condition:** User found in repository
- **Path:**
  1. userRepository.findById(id) returns Optional with user
  2. userMapper.toDTO(user) called
  3. UserDTO returned

**Code:**
```java
User user = userRepository.findById(id).orElseThrow(...);
return userMapper.toDTO(user);
```

### Branch 2: Exception Path
- **Type:** Exception thrown
- **Condition:** User not found in repository
- **Path:**
  1. userRepository.findById(id) returns empty Optional
  2. orElseThrow() executes
  3. EntityNotFoundException thrown

**Code:**
```java
.orElseThrow(() -> new EntityNotFoundException("User not found: " + id))
```

## Branch Coverage Recommendations

To achieve 100% branch coverage, test:
1. ✓ Successful user retrieval (happy path)
2. ✓ User not found scenario (exception path)

## Test Case Template
```java
@Test
void findById_WhenUserExists_ReturnsUserDTO() {
    // Tests Branch 1: Happy Path
    Long userId = 1L;
    User user = new User();
    UserDTO userDTO = new UserDTO();

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(userMapper.toDTO(user)).thenReturn(userDTO);

    UserDTO result = userService.findById(userId);

    assertNotNull(result);
}

@Test
void findById_WhenUserNotFound_ThrowsException() {
    // Tests Branch 2: Exception Path
    Long userId = 999L;

    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThrows(EntityNotFoundException.class,
        () -> userService.findById(userId));
}
```

## Complexity Metrics
- **Cyclomatic Complexity:** 2
- **Branches:** 2
- **Exception Paths:** 1

## File Reference
`/path/to/project/src/main/java/com/example/demo/service/UserService.java:18`

---
Found 2 execution branch(es).
```

**Validation Checklist:**
- ✅ All execution paths identified
- ✅ Branch conditions described
- ✅ Code snippets for each branch
- ✅ Test templates provided
- ✅ Complexity metrics calculated

---

## Phase 3: Macro Context Server Examples

### Example 3.1: build_method_call_chain

**Test Scenario:** Build call chain from controller method to repository

**Tool Invocation:**
```json
{
  "tool": "build_method_call_chain",
  "class_name": "UserController",
  "method_name": "getUser",
  "max_depth": 10
}
```

**Expected Output:**
```markdown
# Method Call Chain: UserController.getUser

## Starting Method
**UserController.getUser(Long id)**
- File: `UserController.java:18`

## Call Chain (Max Depth: 10)

### Depth 0: UserController.getUser
```java
public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
    UserDTO user = userService.findById(id);
    return ResponseEntity.ok(user);
}
```
**Calls:**
- → userService.findById(id) [Depth 1]
- → ResponseEntity.ok(user) [Framework - stops here]

### Depth 1: UserService.findById
**Package:** com.example.demo.service
**File:** `UserService.java:18`
```java
public UserDTO findById(Long id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    return userMapper.toDTO(user);
}
```
**Calls:**
- → userRepository.findById(id) [Depth 2]
- → userMapper.toDTO(user) [Depth 2]

### Depth 2: UserRepository.findById
**Package:** com.example.demo.repository
**Type:** Interface method (Spring Data JPA)
**Stops:** Framework boundary reached
```java
Optional<User> findById(Long id);
```
**Note:** Spring Data JPA implementation - not traversing framework code

### Depth 2: UserMapper.toDTO
**Package:** com.example.demo.mapper
**File:** `UserMapper.java:12`
```java
public UserDTO toDTO(User user) {
    UserDTO dto = new UserDTO();
    dto.setId(user.getId());
    dto.setName(user.getName());
    dto.setEmail(user.getEmail());
    dto.setActive(user.isActive());
    return dto;
}
```
**Calls:**
- → user.getId() [Getter - stops here]
- → user.getName() [Getter - stops here]
- → user.getEmail() [Getter - stops here]
- → user.isActive() [Getter - stops here]

## Call Chain Summary

**Total Depth Reached:** 2
**Total Methods:** 4
**Framework Boundaries Hit:** 2 (Spring Data JPA, ResponseEntity)

### Call Graph
```
UserController.getUser()
├─→ UserService.findById()
│   ├─→ UserRepository.findById() [Spring Data - stops]
│   └─→ UserMapper.toDTO()
│       ├─→ User.getId() [Getter]
│       ├─→ User.getName() [Getter]
│       ├─→ User.getEmail() [Getter]
│       └─→ User.isActive() [Getter]
└─→ ResponseEntity.ok() [Framework - stops]
```

## File References
- `UserController.java:18`
- `UserService.java:18`
- `UserMapper.java:12`

---
Built call chain with 4 method(s) across 2 depth level(s).
```

**Validation Checklist:**
- ✅ Complete call hierarchy shown
- ✅ Depth levels indicated
- ✅ Framework boundaries respected (stops at Spring internals)
- ✅ Visual call graph provided
- ✅ File locations for all methods
- ✅ Code snippets for each method

---

### Example 3.2: trace_endpoint_to_repository

**Test Scenario:** Trace complete flow from POST endpoint to database

**Tool Invocation:**
```json
{
  "tool": "trace_endpoint_to_repository",
  "endpoint_path": "/api/users",
  "http_method": "POST"
}
```

**Expected Output:**
```markdown
# Endpoint to Repository Trace

## Endpoint: POST /api/users

### 1. Controller Layer
**Handler:** UserController.createUser
**File:** `UserController.java:35`

**Method:**
```java
@PostMapping
public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserDTO userDTO) {
    UserDTO created = userService.createUser(userDTO);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
}
```

**Input:** UserDTO (via @RequestBody)
**Output:** ResponseEntity<UserDTO>
**Validation:** @Valid enabled

---

### 2. Service Layer
**Handler:** UserService.createUser
**File:** `UserService.java:32`

**Method:**
```java
public UserDTO createUser(UserDTO userDTO) {
    User user = userMapper.toEntity(userDTO);
    user.setActive(true);
    user.setCreatedAt(LocalDateTime.now());
    User savedUser = userRepository.save(user);
    return userMapper.toDTO(savedUser);
}
```

**Data Transformation:**
- UserDTO → User (via userMapper.toEntity)
- User → UserDTO (via userMapper.toDTO)

**Business Logic:**
- Sets user as active
- Sets creation timestamp
- Saves to database
- Returns DTO response

---

### 3. Repository Layer
**Handler:** UserRepository.save
**Type:** Spring Data JPA

**Method:**
```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // save() inherited from JpaRepository
}
```

**Database Operation:** INSERT
**Entity:** User
**Table:** users

---

### 4. Data Transformation Flow

```
Request Body (JSON)
    ↓
UserDTO (Validated)
    ↓ [userMapper.toEntity()]
User Entity
    ↓ [userRepository.save()]
Database (users table)
    ↓ [userRepository.save() returns]
User Entity (with ID)
    ↓ [userMapper.toDTO()]
UserDTO
    ↓
Response Body (JSON)
```

---

## Complete Flow Summary

### Request Flow
1. **HTTP POST** → /api/users
2. **Controller** receives and validates UserDTO
3. **Service** transforms DTO to Entity
4. **Service** applies business logic (active=true, timestamp)
5. **Repository** saves Entity to database
6. **Service** transforms saved Entity back to DTO
7. **Controller** returns 201 Created with DTO

### Method Call Chain
```
UserController.createUser(@RequestBody UserDTO)
    └─→ UserService.createUser(UserDTO)
        ├─→ UserMapper.toEntity(UserDTO) → User
        ├─→ UserRepository.save(User) → User
        └─→ UserMapper.toDTO(User) → UserDTO
```

### Filters/Interceptors
- Request Validation Filter (Spring @Valid)
- No custom filters detected
- No AOP aspects detected

### Database Impact
- **Table:** users
- **Operation:** INSERT
- **Fields Set:**
  - email (from DTO)
  - name (from DTO)
  - active (set to true)
  - created_at (current timestamp)
  - id (auto-generated)

---

## File References
- `UserController.java:35`
- `UserService.java:32`
- `UserMapper.java:8`
- `UserMapper.java:12`
- `UserRepository.java`

---
Traced complete flow from endpoint to repository.
```

**Validation Checklist:**
- ✅ All layers identified (Controller → Service → Repository)
- ✅ Data transformations mapped
- ✅ Business logic noted
- ✅ Database operation identified
- ✅ Complete flow visualization
- ✅ File references for all components

---

### Example 3.3: find_entity_by_table

**Test Scenario:** Find entity mapped to "users" table

**Tool Invocation:**
```json
{
  "tool": "find_entity_by_table",
  "table_name": "users"
}
```

**Expected Output:**
```markdown
# Entity Mapping: users

## Entity Class
**User**

- **File:** `/path/to/project/src/main/java/com/example/demo/entity/User.java`
- **Package:** com.example.demo.entity
- **Annotations:** @Entity, @Table(name = "users")

## Table Information
- **Table Name:** users
- **Schema:** (default)
- **Catalog:** (none)

## Fields

| Field | Type | Column | Key | Nullable |
|-------|------|--------|-----|----------|
| id | Long | id | 🔑 PK | No |
| email | String | email | | No |
| name | String | name | | No |
| active | boolean | active | | Yes |
| createdAt | LocalDateTime | created_at | | Yes |
| orders | List<Order> | (relationship) | 🔗 FK | Yes |

## Relationships

### @OneToMany: orders
- **Target Entity:** Order
- **Mapped By:** user
- **Cascade:** ALL
- **Fetch Type:** LAZY (default)

## Primary Key
- **Field:** id
- **Type:** Long
- **Strategy:** GenerationType.IDENTITY (auto-increment)

## Unique Constraints
- **email** column has unique constraint

## Summary
- **Total Fields:** 6
- **Database Columns:** 5
- **Relationships:** 1 (@OneToMany)
- **Primary Key:** id

## File Reference
`/path/to/project/src/main/java/com/example/demo/entity/User.java`

---
Entity `User` maps to table `users`
```

**Validation Checklist:**
- ✅ Correct entity found for table name
- ✅ All fields with column mappings
- ✅ JPA relationships identified
- ✅ Primary key and constraints noted
- ✅ Table and entity names mapped

---

## Phase 4: Spring Component Server Examples

### Example 4.1: analyze_controller_method

**Test Scenario:** Analyze POST endpoint that creates a user

**Tool Invocation:**
```json
{
  "tool": "analyze_controller_method",
  "controller_name": "UserController",
  "method_name": "createUser"
}
```

**Expected Output:**
```markdown
# Controller Method Analysis: UserController.createUser

## Method Signature
```java
public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserDTO userDTO)
```

## Endpoint Mapping
- **Path:** `/api/users`
- **HTTP Method:** POST
- **Produces:** application/json (default)
- **Consumes:** application/json (default)

## Request Parameters

### @RequestBody: userDTO
- **Type:** `UserDTO`
- **DTO File:** `/path/to/dto/UserDTO.java`
- **Required:** Yes
- **Validated:** Yes (@Valid)

**Validation Rules:**
- @NotBlank on name field
- @Email on email field
- @NotBlank on email field

## Return Type
- **Wrapped:** ResponseEntity
- **Response DTO:** `UserDTO`
- **DTO File:** `/path/to/dto/UserDTO.java`
- **Status Code:** 201 CREATED (from HttpStatus.CREATED)

## Method Body Preview
```java
public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserDTO userDTO) {
    UserDTO created = userService.createUser(userDTO);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
}
```

## Related DTOs

### Request: UserDTO
- **Fields:** 4 (id, name, email, active)
- **File:** `/path/to/dto/UserDTO.java`
- **Validation:** Enabled (2 @NotBlank, 1 @Email)

### Response: UserDTO
- **Fields:** 4 (same as request)
- **File:** `/path/to/dto/UserDTO.java`

## Summary
- **Total Parameters:** 1
- **Request Body:** Yes
- **Validation:** Enabled
- **HTTP Status:** 201 Created
- **Idempotent:** No (POST creates new resource)

## File References
- Controller: `/path/to/UserController.java:35`
- Request DTO: `/path/to/UserDTO.java`

---
Analyzed successfully.
```

**Validation Checklist:**
- ✅ Complete method signature
- ✅ Endpoint path and HTTP method
- ✅ @RequestBody parameter identified
- ✅ Validation annotations captured
- ✅ Return type unwrapped (ResponseEntity → UserDTO)
- ✅ Status code noted
- ✅ Related DTOs summarized

---

### Example 4.2: find_controller_for_endpoint

**Test Scenario:** Find handler for GET /api/users/123

**Tool Invocation:**
```json
{
  "tool": "find_controller_for_endpoint",
  "endpoint": "/api/users/123",
  "http_method": "GET"
}
```

**Expected Output:**
```markdown
# Endpoint Handler: GET /api/users/123

## Handler Found
- **Controller:** UserController
- **Method:** getUser
- **File:** `/path/to/UserController.java:18`

## Complete Mapping
- **Base Path:** /api/users (from @RequestMapping on class)
- **Method Path:** /{id} (from @GetMapping on method)
- **Full Path:** /api/users/{id}
- **HTTP Method:** GET
- **Pattern Match:** /api/users/123 matches /api/users/{id}

## Method Signature
```java
@GetMapping("/{id}")
public ResponseEntity<UserDTO> getUser(@PathVariable Long id)
```

## Quick Info
- **Request Type:** N/A (no @RequestBody)
- **Response Type:** UserDTO
- **Async:** No
- **Path Variables:** id (Long)

## Related Endpoints in Controller

| Method | Path | HTTP | Handler |
|--------|------|------|---------|
| → getUser | /api/users/{id} | GET | getUser() |
|   getAllActiveUsers | /api/users | GET | getAllActiveUsers() |
|   createUser | /api/users | POST | createUser() |
|   deleteUser | /api/users/{id} | DELETE | deleteUser() |

## File References
- Controller: `/path/to/UserController.java`

---
Handler found.
```

**Validation Checklist:**
- ✅ Path variable matching works (123 → {id})
- ✅ Controller and method identified
- ✅ Complete mapping shown (base + method path)
- ✅ Related endpoints listed
- ✅ Current endpoint highlighted (→ marker)
- ✅ File location provided

---

### Example 4.3: find_implementations

**Test Scenario:** Find all implementations of UserRepository

**Tool Invocation:**
```json
{
  "tool": "find_implementations",
  "interface_or_abstract_class": "UserRepository"
}
```

**Expected Output:**
```markdown
# Implementations: UserRepository

## Parent Type
- **Name:** UserRepository
- **Type:** Interface
- **File:** `/path/to/UserRepository.java`
- **Package:** com.example.demo.repository
- **Extends:** JpaRepository<User, Long>

## Methods Defined

- `findByEmail(String)`
- `findByActiveTrue()`

## Implementations: 0

**Note:** UserRepository extends JpaRepository, which is implemented by Spring Data JPA at runtime. Spring Data automatically creates the implementation using proxy-based mechanisms.

### Runtime Implementation
- **Provider:** Spring Data JPA
- **Type:** Dynamic Proxy
- **Implementation Class:** SimpleJpaRepository (Spring Framework)

## Additional Information

This is a Spring Data JPA repository. Spring automatically provides implementations for:
- All methods inherited from JpaRepository (save, findById, findAll, etc.)
- Custom query methods declared in the interface (findByEmail, findByActiveTrue)

### Query Methods Analysis

**findByEmail(String):**
- Spring generates: `SELECT u FROM User u WHERE u.email = :email`

**findByActiveTrue():**
- Spring generates: `SELECT u FROM User u WHERE u.active = true`

## Summary
- **Total Implementations:** 0 (provided by Spring Data JPA)
- **Direct:** 0
- **Indirect:** 0
- **Abstract:** 0
- **Spring Data Repository:** Yes

## File References
- `/path/to/UserRepository.java`

---
Found 0 implementation(s) - Spring Data repository detected.
```

**Alternative Example:** PaymentService interface with multiple implementations

**Tool Invocation:**
```json
{
  "tool": "find_implementations",
  "interface_or_abstract_class": "PaymentService"
}
```

**Expected Output:**
```markdown
# Implementations: PaymentService

## Parent Type
- **Name:** PaymentService
- **Type:** Interface
- **File:** `/path/to/PaymentService.java`
- **Package:** com.example.demo.service

## Methods Defined

- `processPayment(PaymentRequest)`
- `refundPayment(String)`
- `getPaymentStatus(String)`

## Implementations: 3

### Implementation 1: CreditCardPaymentService
- **File:** `/path/to/CreditCardPaymentService.java`
- **Package:** com.example.demo.service.impl
- **Abstract:** No

**Overridden Methods:**
- ✓ processPayment(PaymentRequest)
- ✓ refundPayment(String)
- ✓ getPaymentStatus(String)

**Additional Methods:**
- validateCardNumber(String)
- processCardTransaction(CardDetails)

**Annotations:**
- @Service
- @Qualifier("creditCard")

**Usage Context:**
Handles credit card payments using external payment gateway

### Implementation 2: PayPalPaymentService
- **File:** `/path/to/PayPalPaymentService.java`
- **Package:** com.example.demo.service.impl
- **Abstract:** No

**Overridden Methods:**
- ✓ processPayment(PaymentRequest)
- ✓ refundPayment(String)
- ✓ getPaymentStatus(String)

**Additional Methods:**
- connectToPayPal()
- handlePayPalCallback(String)

**Annotations:**
- @Service
- @Qualifier("paypal")

### Implementation 3: BankTransferPaymentService
- **File:** `/path/to/BankTransferPaymentService.java`
- **Package:** com.example.demo.service.impl
- **Abstract:** No

**Overridden Methods:**
- ✓ processPayment(PaymentRequest)
- ✓ refundPayment(String)
- ✓ getPaymentStatus(String)

**Additional Methods:**
- validateBankAccount(String)
- initiateTransfer(TransferRequest)

**Annotations:**
- @Service
- @Qualifier("bankTransfer")

## Inheritance Hierarchy
```
PaymentService
├── CreditCardPaymentService
├── PayPalPaymentService
└── BankTransferPaymentService
```

## Summary
- **Total Implementations:** 3
- **Direct:** 3
- **Indirect:** 0
- **Abstract:** 0

## Usage Patterns
- **Strategy Pattern:** Yes (3+ implementations with polymorphic usage)
- **Polymorphic Usage:** Multiple payment methods using common interface

## File References
- `/path/to/PaymentService.java`
- `/path/to/CreditCardPaymentService.java`
- `/path/to/PayPalPaymentService.java`
- `/path/to/BankTransferPaymentService.java`

---
Found 3 implementation(s).
```

**Validation Checklist:**
- ✅ All implementations found
- ✅ Overridden methods identified
- ✅ Additional methods listed
- ✅ Annotations captured (@Service, @Qualifier)
- ✅ Inheritance hierarchy visualized
- ✅ Strategy pattern detected
- ✅ Special handling for Spring Data repositories

---

### Example 4.4: find_feature_flag_usage

**Test Scenario:** Find all feature flag usage in the codebase

**Sample Code with Feature Flags:**
```java
@Service
public class UserService {

    @Autowired
    private FeatureFlagService featureFlagService;

    public UserDTO findById(Long id) {
        if (featureFlagService.isFeatureEnabled("new-user-lookup")) {
            // New optimized lookup
            return optimizedUserLookup(id);
        } else {
            // Legacy lookup
            return legacyUserLookup(id);
        }
    }

    public List<UserDTO> findAll() {
        boolean useCache = featureFlagService.isFeatureEnabled("user-cache");
        return useCache ? findAllFromCache() : findAllFromDatabase();
    }
}
```

**Tool Invocation:**
```json
{
  "tool": "find_feature_flag_usage"
}
```

**Expected Output:**
```markdown
# Feature Flag Usage Analysis

## Flags Detected: 2

### Flag 1: new-user-lookup

#### Usage Locations: 1

##### Usage 1: UserService.findById
**Location:** `/path/to/UserService.java:12`

**Conditional Logic:**
```java
if (featureFlagService.isFeatureEnabled("new-user-lookup")) {
    // New optimized lookup
    return optimizedUserLookup(id);
} else {
    // Legacy lookup
    return legacyUserLookup(id);
}
```

**Condition Type:** if-else

**Branches:**
- ✓ Flag Enabled: return optimizedUserLookup(id);
- ✗ Flag Disabled: return legacyUserLookup(id);

**Impact:** Controls user lookup implementation strategy

### Flag 2: user-cache

#### Usage Locations: 1

##### Usage 1: UserService.findAll
**Location:** `/path/to/UserService.java:23`

**Conditional Logic:**
```java
boolean useCache = featureFlagService.isFeatureEnabled("user-cache");
return useCache ? findAllFromCache() : findAllFromDatabase();
```

**Condition Type:** ternary

**Branches:**
- ✓ Flag Enabled: findAllFromCache()
- ✗ Flag Disabled: findAllFromDatabase()

**Impact:** Enables caching for user list queries

## Summary
- **Total Flags:** 2
- **Total Usages:** 2
- **Files Affected:** 1

## Recommendations
- Both flags found in UserService - consider if these should be consolidated
- Document rollout plan for "new-user-lookup" feature
- Monitor performance impact of "user-cache" feature

## File References
- `/path/to/UserService.java`

---
Found 2 flag(s) with 2 usage(s).
```

**With Specific Flag Search:**

**Tool Invocation:**
```json
{
  "tool": "find_feature_flag_usage",
  "flag_identifier": "new-user-lookup"
}
```

**Expected Output:**
```markdown
# Feature Flag Usage Analysis

## Searching for: new-user-lookup

## Flags Detected: 1

### Flag 1: new-user-lookup

#### Usage Locations: 1

##### Usage 1: UserService.findById
**Location:** `/path/to/UserService.java:12`

**Conditional Logic:**
```java
if (featureFlagService.isFeatureEnabled("new-user-lookup")) {
    return optimizedUserLookup(id);
} else {
    return legacyUserLookup(id);
}
```

**Condition Type:** if-else

**Branches:**
- ✓ Flag Enabled: return optimizedUserLookup(id);
- ✗ Flag Disabled: return legacyUserLookup(id);

**Impact:** Controls user lookup implementation strategy

## Flag Impact Analysis

### new-user-lookup
**Affects:** 1 component(s)

| Component | Impact | File |
|-----------|--------|------|
| UserService | Changes lookup strategy | UserService.java:12 |

## Summary
- **Total Flags:** 1
- **Total Usages:** 1
- **Files Affected:** 1

## Recommendations
- Flag has single usage - good isolation
- Consider A/B testing before full rollout
- Plan for flag removal after successful deployment

## File References
- `/path/to/UserService.java`

---
Found 1 flag(s) with 1 usage(s).
```

**Validation Checklist:**
- ✅ All feature flag patterns detected
- ✅ Flag names extracted from string literals
- ✅ Conditional logic captured (if-else and ternary)
- ✅ Both branches identified
- ✅ Impact analysis provided
- ✅ Recommendations generated
- ✅ Specific flag filtering works

---

## Testing Tips

### Quick Validation Steps

**For each tool test:**

1. **Verify Output Structure**
   - Check markdown formatting is correct
   - Verify all expected sections present
   - Ensure proper code block syntax

2. **Validate Content Accuracy**
   - Compare output with actual source code
   - Verify all fields/methods listed
   - Check line numbers are correct

3. **Test Edge Cases**
   - Non-existent classes/methods
   - Empty results
   - Complex nested structures

4. **Performance Check**
   - Tool completes within reasonable time
   - No memory issues
   - Handles large codebases

### Common Issues to Watch For

❌ **Missing Information**
- Fields or methods not listed
- Annotations not captured
- Relationships not shown

❌ **Incorrect Parsing**
- Wrong method signatures
- Incorrect type information
- Missing generic types

❌ **Poor Error Handling**
- Cryptic error messages
- Tool crashes on invalid input
- No suggestions provided

✅ **Good Output Should Have:**
- Complete information
- Clear structure
- File references with line numbers
- Helpful context and summaries
- Actionable insights

---

## Next Steps

1. **Run These Examples** against your test Spring Boot project
2. **Compare Output** with expected results in this document
3. **Document Deviations** - note where actual output differs
4. **Report Issues** - create bug reports for failures
5. **Add More Examples** - expand this document with your findings

## Need Help?

If actual output differs significantly from these examples:
1. Check Java parser service is running
2. Verify workspace path is correct
3. Ensure Spring Boot project compiles
4. Check logs for parser errors
5. Validate tool parameters are correct
