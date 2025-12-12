# Comprehensive Test Plan for Spring Boot MCP Servers

## Test Environment Setup

### Prerequisites
- Java 11+ installed
- Node.js 18+ installed
- Maven 3.6+
- A sample Spring Boot project (Spring Boot 2.x or 3.x)
- Test project should include:
  - REST Controllers with various endpoint mappings
  - Service layer with business logic
  - Repository layer (JPA)
  - DTOs and Entity classes
  - Some interfaces with multiple implementations
  - AOP aspects (optional)
  - Feature flags (optional)

### Setup Steps
1. Build all packages:
   ```bash
   npm run build
   cd packages/java-parser-service && mvn clean package
   ```

2. Prepare test Spring Boot project path:
   ```bash
   export TEST_PROJECT_PATH="/path/to/spring-boot-project"
   ```

---

## Phase 2: Micro Context Server Tests (5 Tools)

### Tool 2.1: `get_class_info`
**Purpose:** Extracts class structure, fields, methods, and annotations.

#### Test Cases:

**TC-2.1.1: Simple POJO Class**
- **Input:** Class name of a simple POJO (e.g., `UserDTO`)
- **Expected Output:**
  - Class name and package
  - All fields with types
  - All methods with signatures
  - Any annotations present
- **Validation:** Verify all fields and methods are listed

**TC-2.1.2: Entity Class with JPA Annotations**
- **Input:** JPA entity class name (e.g., `User`)
- **Expected Output:**
  - `@Entity` annotation
  - `@Table` annotation with table name
  - Field annotations (`@Id`, `@Column`, `@ManyToOne`, etc.)
  - Getters and setters
- **Validation:** All JPA annotations captured correctly

**TC-2.1.3: Controller Class**
- **Input:** REST controller class name (e.g., `UserController`)
- **Expected Output:**
  - `@RestController` or `@Controller` annotation
  - `@RequestMapping` base path
  - All endpoint methods with their mappings
- **Validation:** Controller structure complete

**TC-2.1.4: Non-existent Class**
- **Input:** Invalid class name (e.g., `NonExistentClass`)
- **Expected Output:** Clear error message indicating class not found
- **Validation:** Graceful error handling

**TC-2.1.5: Inner Class**
- **Input:** Inner class reference (e.g., `OuterClass.InnerClass`)
- **Expected Output:** Inner class details
- **Validation:** Proper handling of nested classes

---

### Tool 2.2: `get_method_body`
**Purpose:** Retrieves the complete implementation of a method.

#### Test Cases:

**TC-2.2.1: Simple Service Method**
- **Input:** Service class + method name (e.g., `UserService.findById`)
- **Expected Output:**
  - Complete method signature
  - Full method body with all statements
  - Return type
- **Validation:** Code is complete and properly formatted

**TC-2.2.2: Controller Endpoint Method**
- **Input:** Controller method (e.g., `UserController.getUser`)
- **Expected Output:**
  - Endpoint annotations
  - Parameter annotations
  - Method body
- **Validation:** Annotations included in output

**TC-2.2.3: Method with Complex Logic**
- **Input:** Method with loops, conditionals, try-catch
- **Expected Output:** All control structures preserved
- **Validation:** Code structure intact

**TC-2.2.4: Overloaded Methods**
- **Input:** Method name with multiple signatures
- **Expected Output:** Specific method body or list of overloads
- **Validation:** Correct method selected

**TC-2.2.5: Method Not Found**
- **Input:** Invalid method name
- **Expected Output:** Error message with suggestions
- **Validation:** Helpful error message

---

### Tool 2.3: `get_dto_structure`
**Purpose:** Analyzes DTO/Entity structure with field hierarchies.

#### Test Cases:

**TC-2.3.1: Simple DTO**
- **Input:** DTO class with primitive fields (e.g., `UserDTO`)
- **Expected Output:**
  - All fields with types
  - Validation annotations if present
  - Max depth: 1
- **Validation:** All fields listed correctly

**TC-2.3.2: Nested DTO**
- **Input:** DTO with nested objects (e.g., `OrderDTO` containing `UserDTO`)
- **Max Depth:** 3
- **Expected Output:**
  - Parent DTO fields
  - Nested DTO fields expanded
  - Depth indicator for each level
- **Validation:** Hierarchy properly represented

**TC-2.3.3: Circular Reference**
- **Input:** DTO with circular reference (e.g., `User` references `Order`, `Order` references `User`)
- **Expected Output:** Circular reference detected and handled
- **Validation:** No infinite loop or stack overflow

**TC-2.3.4: Collection Fields**
- **Input:** DTO with List/Set/Map fields
- **Expected Output:** Collection types with generic parameters
- **Validation:** Generic types captured

**TC-2.3.5: Entity with Relationships**
- **Input:** JPA entity with `@OneToMany`, `@ManyToOne`
- **Expected Output:**
  - Relationship annotations
  - Mapped entities referenced
  - Lazy/Eager fetch types
- **Validation:** JPA relationships documented

---

### Tool 2.4: `find_mockable_dependencies`
**Purpose:** Identifies dependencies that need mocking in tests.

#### Test Cases:

**TC-2.4.1: Service Class Dependencies**
- **Input:** Service class that injects repositories
- **Expected Output:**
  - All `@Autowired` dependencies
  - Dependency types
  - Field names
- **Validation:** All injectable fields listed

**TC-2.4.2: Constructor Injection**
- **Input:** Class using constructor injection
- **Expected Output:**
  - Constructor parameters as dependencies
  - Parameter types
- **Validation:** Constructor dependencies identified

**TC-2.4.3: Multiple Injection Types**
- **Input:** Class with field, setter, and constructor injection
- **Expected Output:** All injection types captured
- **Validation:** No duplicates, all types covered

**TC-2.4.4: No Dependencies**
- **Input:** Class with no dependencies (e.g., utility class)
- **Expected Output:** Empty list or message indicating no dependencies
- **Validation:** Clear indication of no mockable dependencies

**TC-2.4.5: Framework Dependencies**
- **Input:** Class injecting Spring framework beans (e.g., `RestTemplate`)
- **Expected Output:** Framework dependencies identified
- **Validation:** Distinguishes custom vs framework dependencies

---

### Tool 2.5: `find_execution_branches`
**Purpose:** Analyzes method execution paths and branches.

#### Test Cases:

**TC-2.5.1: Simple If-Else**
- **Input:** Method with single if-else statement
- **Expected Output:**
  - Branch count: 2
  - Conditions identified
  - Branch paths described
- **Validation:** Both branches detected

**TC-2.5.2: Nested Conditionals**
- **Input:** Method with nested if statements
- **Expected Output:**
  - All branch levels identified
  - Nesting depth indicated
  - Total branch count
- **Validation:** Nested structure captured

**TC-2.5.3: Switch Statement**
- **Input:** Method with switch/case
- **Expected Output:**
  - All case branches
  - Default case if present
  - Branch count
- **Validation:** All cases listed

**TC-2.5.4: Try-Catch Blocks**
- **Input:** Method with exception handling
- **Expected Output:**
  - Try branch
  - Catch branches (multiple if present)
  - Finally block
- **Validation:** Exception paths identified

**TC-2.5.5: Loops with Conditionals**
- **Input:** Method with for/while loops containing conditions
- **Expected Output:**
  - Loop branches
  - Conditions within loops
- **Validation:** Loop logic analyzed

---

## Phase 3: Macro Context Server Tests (7 Tools)

### Tool 3.1: `build_method_call_chain`
**Purpose:** Builds complete call chain from a method to nested calls.

#### Test Cases:

**TC-3.1.1: Simple Call Chain**
- **Input:** Controller method calling one service method
- **Max Depth:** 5
- **Expected Output:**
  - Controller method (depth 0)
  - Service method (depth 1)
  - Any repository calls (depth 2)
- **Validation:** Chain follows logical flow

**TC-3.1.2: Deep Call Chain**
- **Input:** Method with multiple nested calls
- **Max Depth:** 10
- **Expected Output:**
  - All levels up to max depth
  - Framework boundary stops (e.g., JPA methods)
- **Validation:** Stops at framework boundaries

**TC-3.1.3: Multiple Branches**
- **Input:** Method calling multiple service methods
- **Expected Output:**
  - All parallel call paths
  - Branch indicators
- **Validation:** All branches captured

**TC-3.1.4: Recursive Method**
- **Input:** Recursive method call
- **Expected Output:** Recursion detected and handled
- **Validation:** No infinite loop

**TC-3.1.5: Framework Boundary**
- **Input:** Method calling Spring framework method
- **Expected Output:** Stops at framework call, doesn't traverse into Spring internals
- **Validation:** Framework package stopping works

---

### Tool 3.2: `trace_data_transformation`
**Purpose:** Traces how data transforms through method calls.

#### Test Cases:

**TC-3.2.1: DTO to Entity Conversion**
- **Input:** Controller method receiving DTO, saving as Entity
- **Start Class:** Controller
- **Data Object:** DTO class name
- **Expected Output:**
  - DTO received at controller
  - Conversion point identified
  - Entity saved to repository
- **Validation:** Transformation path clear

**TC-3.2.2: Entity to DTO Conversion**
- **Input:** Service method fetching Entity, returning DTO
- **Expected Output:**
  - Entity loaded from repository
  - Mapper/conversion method called
  - DTO returned
- **Validation:** Reverse transformation tracked

**TC-3.2.3: Multiple Transformations**
- **Input:** Data passing through multiple layers with transformations
- **Expected Output:**
  - All transformation points
  - Intermediate types
- **Validation:** Complete transformation chain

**TC-3.2.4: No Transformation**
- **Input:** Method passing data without transformation
- **Expected Output:** Data passed through unchanged
- **Validation:** No false positive transformations

---

### Tool 3.3: `find_all_usages`
**Purpose:** Finds all usages of a method, field, or class.

#### Test Cases:

**TC-3.3.1: Method Usages**
- **Input:** Common service method (e.g., `findById`)
- **Target Type:** method
- **Expected Output:**
  - All classes calling this method
  - Line numbers
  - File paths
- **Validation:** All usages found

**TC-3.3.2: Field Usages**
- **Input:** Class field
- **Target Type:** field
- **Expected Output:**
  - All reads and writes
  - Method contexts
- **Validation:** Complete field usage

**TC-3.3.3: Class Usages**
- **Input:** DTO class
- **Target Type:** class
- **Expected Output:**
  - All imports
  - All instantiations
  - All type references
- **Validation:** All references found

**TC-3.3.4: Interface Method Usages**
- **Input:** Interface method
- **Expected Output:**
  - All implementations
  - All calls to interface method
- **Validation:** Polymorphic usage detected

**TC-3.3.5: No Usages**
- **Input:** Unused method/field/class
- **Expected Output:** Clear message indicating no usages
- **Validation:** Handles unused code gracefully

---

### Tool 3.4: `trace_endpoint_to_repository`
**Purpose:** Traces complete flow from endpoint to repository.

#### Test Cases:

**TC-3.4.1: Simple GET Endpoint**
- **Input:** GET endpoint path (e.g., `/api/users/{id}`)
- **HTTP Method:** GET
- **Expected Output:**
  - Controller method
  - Service method(s)
  - Repository method
  - Complete call chain
- **Validation:** Full stack trace

**TC-3.4.2: POST Endpoint with Save**
- **Input:** POST endpoint creating resource
- **Expected Output:**
  - Controller receiving DTO
  - Service processing
  - Repository save operation
  - Data transformations noted
- **Validation:** Create flow traced

**TC-3.4.3: Complex Endpoint**
- **Input:** Endpoint with multiple service/repository calls
- **Expected Output:**
  - All service calls
  - All repository operations
  - Order of operations
- **Validation:** Complete flow mapped

**TC-3.4.4: Endpoint with Filters/Interceptors**
- **Input:** Endpoint with AOP or filters
- **Expected Output:**
  - Pre-processing filters
  - Main handler
  - Post-processing
- **Validation:** Middleware included

---

### Tool 3.5: `find_entity_by_table`
**Purpose:** Finds JPA entity mapped to database table.

#### Test Cases:

**TC-3.5.1: Simple Entity Mapping**
- **Input:** Table name (e.g., `users`)
- **Expected Output:**
  - Entity class name
  - File path
  - All fields with column mappings
- **Validation:** Correct entity found

**TC-3.5.2: Custom Table Name**
- **Input:** Table name from `@Table(name="custom_name")`
- **Expected Output:** Entity with custom table mapping
- **Validation:** Custom naming detected

**TC-3.5.3: Table with Schema**
- **Input:** Table name with schema (e.g., `public.users`)
- **Schema:** public
- **Expected Output:** Entity matching schema
- **Validation:** Schema filtering works

**TC-3.5.4: Entity Relationships**
- **Input:** Table with foreign keys
- **Expected Output:**
  - Entity with relationships
  - `@OneToMany`, `@ManyToOne` annotations
  - Related entities
- **Validation:** Relationships mapped

**TC-3.5.5: Table Not Found**
- **Input:** Non-existent table name
- **Expected Output:**
  - Error message
  - Similar table suggestions
- **Validation:** Helpful error with alternatives

---

### Tool 3.6: `find_advice_adapters`
**Purpose:** Finds AOP aspects and advice intercepting methods.

#### Test Cases:

**TC-3.6.1: All Aspects**
- **Input:** No specific target
- **Expected Output:**
  - All `@Aspect` classes
  - All advice methods
  - Pointcut expressions
- **Validation:** Complete aspect catalog

**TC-3.6.2: Target Class Advice**
- **Input:** Specific class name
- **Expected Output:**
  - Aspects targeting this class
  - Matching advice
  - Execution order
- **Validation:** Relevant aspects only

**TC-3.6.3: Target Method Advice**
- **Input:** Class + method name
- **Expected Output:**
  - Advice methods intercepting this method
  - Advice types (Before/After/Around)
  - Order of execution
- **Validation:** Method-level filtering

**TC-3.6.4: Execution Order**
- **Input:** Multiple aspects with `@Order`
- **Expected Output:**
  - Aspects sorted by order
  - Execution sequence diagram
- **Validation:** Order calculation correct

**TC-3.6.5: No Aspects**
- **Input:** Project without AOP
- **Expected Output:** Message indicating no aspects
- **Validation:** Graceful handling

---

### Tool 3.7: `find_filters_and_order`
**Purpose:** Finds servlet filters and interceptors with execution order.

#### Test Cases:

**TC-3.7.1: All Filters and Interceptors**
- **Input:** Filter type: all
- **Expected Output:**
  - All servlet filters
  - All interceptors
  - Execution order
  - Filter chain diagram
- **Validation:** Complete list with order

**TC-3.7.2: Servlet Filters Only**
- **Input:** Filter type: servlet
- **Expected Output:**
  - Only servlet filters
  - `@WebFilter` annotations
  - URL patterns
- **Validation:** Interceptors excluded

**TC-3.7.3: Interceptors Only**
- **Input:** Filter type: interceptor
- **Expected Output:**
  - Only `HandlerInterceptor` implementations
  - Path patterns
  - Exclude patterns
- **Validation:** Servlet filters excluded

**TC-3.7.4: Order Detection**
- **Input:** Filters with `@Order` annotations
- **Expected Output:**
  - Correct order values
  - Sorted by priority
  - Default order for unordered filters
- **Validation:** Ordering logic correct

**TC-3.7.5: Filter Chain Diagram**
- **Input:** Multiple filters
- **Expected Output:** ASCII diagram showing execution flow
- **Validation:** Visual representation clear

---

## Phase 4: Spring Component Server Tests (4 Tools)

### Tool 4.1: `analyze_controller_method`
**Purpose:** Analyzes controller method parameters and return types.

#### Test Cases:

**TC-4.1.1: GET Endpoint with Path Variable**
- **Input:** Controller + method (e.g., `UserController.getUser`)
- **Expected Output:**
  - Endpoint path with `{id}` placeholder
  - `@PathVariable` parameter
  - Return type (DTO)
  - HTTP method: GET
- **Validation:** Path variables captured

**TC-4.1.2: POST Endpoint with Request Body**
- **Input:** POST endpoint method
- **Expected Output:**
  - `@RequestBody` parameter with DTO type
  - Validation annotations (`@Valid`)
  - Response type
  - Consumes/Produces media types
- **Validation:** Request body details complete

**TC-4.1.3: Multiple Request Parameters**
- **Input:** Method with `@RequestParam`, `@RequestHeader`, `@PathVariable`
- **Expected Output:**
  - All parameters categorized by annotation
  - Required vs optional
  - Default values
- **Validation:** All parameter types identified

**TC-4.1.4: ResponseEntity Return Type**
- **Input:** Method returning `ResponseEntity<DTO>`
- **Expected Output:**
  - Wrapper type: ResponseEntity
  - Actual response type: DTO
- **Validation:** Wrapper unwrapped correctly

**TC-4.1.5: Reactive Return Types**
- **Input:** Method returning `Mono<>` or `Flux<>`
- **Expected Output:**
  - Async indicator: Yes
  - Unwrapped type
- **Validation:** Reactive types handled

---

### Tool 4.2: `find_controller_for_endpoint`
**Purpose:** Finds controller handling specific endpoint.

#### Test Cases:

**TC-4.2.1: Exact Path Match**
- **Input:** Endpoint: `/api/users`
- **HTTP Method:** GET
- **Expected Output:**
  - Matching controller
  - Method name
  - Complete mapping details
- **Validation:** Exact match found

**TC-4.2.2: Path Variable Matching**
- **Input:** Endpoint: `/api/users/123`
- **Expected Output:**
  - Controller with `/api/users/{id}` pattern
  - Pattern match explanation
- **Validation:** Variable path matching works

**TC-4.2.3: Base Path Combination**
- **Input:** Endpoint with controller base path + method path
- **Expected Output:**
  - Base path from class-level `@RequestMapping`
  - Method path
  - Combined full path
- **Validation:** Path combination correct

**TC-4.2.4: HTTP Method Filtering**
- **Input:** Same path with different HTTP methods
- **Expected Output:** Only matching HTTP method handler
- **Validation:** Method filtering works

**TC-4.2.5: No Handler Found**
- **Input:** Non-existent endpoint
- **Expected Output:**
  - Error message
  - Similar endpoints suggested
- **Validation:** Suggestions helpful

**TC-4.2.6: Related Endpoints**
- **Input:** Any endpoint
- **Expected Output:**
  - Matched endpoint highlighted
  - Other endpoints in same controller listed
- **Validation:** Controller context provided

---

### Tool 4.3: `find_implementations`
**Purpose:** Finds all implementations of interface/abstract class.

#### Test Cases:

**TC-4.3.1: Interface with Multiple Implementations**
- **Input:** Service interface name (e.g., `PaymentService`)
- **Expected Output:**
  - All implementing classes
  - Which methods are overridden
  - Additional methods in implementations
- **Validation:** All implementations found

**TC-4.3.2: Abstract Class Extensions**
- **Input:** Abstract class name
- **Expected Output:**
  - All extending classes
  - Abstract vs concrete implementations
- **Validation:** Extensions identified

**TC-4.3.3: Method Override Analysis**
- **Input:** Interface with methods
- **Expected Output:**
  - Which methods each implementation overrides
  - Which methods are not implemented (if abstract)
- **Validation:** Override status accurate

**TC-4.3.4: Inheritance Hierarchy**
- **Input:** Interface with multiple levels
- **Expected Output:**
  - Tree diagram of hierarchy
  - Direct vs indirect implementations
- **Validation:** Hierarchy visualized

**TC-4.3.5: Strategy Pattern Detection**
- **Input:** Interface with 3+ implementations
- **Expected Output:**
  - Strategy pattern indicator: Yes
  - Polymorphic usage context
- **Validation:** Pattern detection works

**TC-4.3.6: No Implementations**
- **Input:** Interface with no implementations
- **Expected Output:** Clear message indicating no implementations
- **Validation:** Handles unused interfaces

---

### Tool 4.4: `find_feature_flag_usage`
**Purpose:** Finds feature flag conditional logic.

#### Test Cases:

**TC-4.4.1: Method Call Pattern**
- **Input:** No specific flag (search all)
- **Expected Output:**
  - All `isFeatureEnabled()` calls
  - Flag names from string arguments
  - Usage locations
- **Validation:** All flag checks found

**TC-4.4.2: Specific Flag Search**
- **Input:** Flag identifier: "new-ui-feature"
- **Expected Output:**
  - All usages of this specific flag
  - Conditional logic context
  - Enabled/disabled branches
- **Validation:** Flag filtering works

**TC-4.4.3: Custom Pattern Search**
- **Input:** Search pattern: "hasFeature"
- **Expected Output:**
  - All methods matching pattern
  - Flag names extracted
- **Validation:** Custom patterns work

**TC-4.4.4: If-Else Analysis**
- **Input:** Flag in if statement
- **Expected Output:**
  - If branch (flag enabled)
  - Else branch (flag disabled)
  - Code snippets for both
- **Validation:** Branch logic captured

**TC-4.4.5: Ternary Operator**
- **Input:** Flag in ternary expression
- **Expected Output:**
  - Condition type: ternary
  - True expression
  - False expression
- **Validation:** Ternary detected

**TC-4.4.6: Annotation-based Flags**
- **Input:** `@ConditionalOnProperty` annotations
- **Expected Output:**
  - Class/method with annotation
  - Property key
  - Default value
- **Validation:** Annotation flags found

**TC-4.4.7: Flag Impact Analysis**
- **Input:** Flag with multiple usages
- **Expected Output:**
  - Number of affected components
  - Files affected count
  - Recommendations if high usage
- **Validation:** Impact metrics calculated

**TC-4.4.8: No Flags Found**
- **Input:** Project without feature flags
- **Expected Output:**
  - Message indicating no flags
  - Common patterns suggested
- **Validation:** Helpful guidance provided

---

## Performance Tests

### Performance Benchmarks

**PB-1: Large Codebase Handling**
- **Test:** Run tools on Spring Boot project with 500+ classes
- **Expected:** Completion within 30 seconds per tool
- **Validation:** No timeouts or memory issues

**PB-2: Deep Call Chain**
- **Test:** Method with 20+ nested calls
- **Expected:** Complete chain built within 15 seconds
- **Validation:** No stack overflow

**PB-3: Many Implementations**
- **Test:** Interface with 50+ implementations
- **Expected:** All found within 10 seconds
- **Validation:** No degradation

**PB-4: Concurrent Tool Execution**
- **Test:** Run multiple tools simultaneously
- **Expected:** All complete without interference
- **Validation:** No race conditions

---

## Error Handling Tests

### Error Scenarios

**EH-1: Malformed Java Code**
- **Test:** Analyze file with syntax errors
- **Expected:** Graceful error, skip malformed file
- **Validation:** Doesn't crash parser

**EH-2: Missing Dependencies**
- **Test:** Code references external classes
- **Expected:** Best effort analysis, note missing dependencies
- **Validation:** Partial results returned

**EH-3: Invalid Input Parameters**
- **Test:** Pass invalid class/method names
- **Expected:** Clear error messages with suggestions
- **Validation:** User-friendly errors

**EH-4: Empty Project**
- **Test:** Run on project with no source files
- **Expected:** Error indicating no files found
- **Validation:** Handles empty projects

**EH-5: Circular Dependencies**
- **Test:** Classes with circular references
- **Expected:** Detect and break cycles
- **Validation:** No infinite loops

---

## Integration Tests

### End-to-End Scenarios

**INT-1: Complete Flow Analysis**
- **Test:** Trace user request from endpoint to database
  1. Use `find_controller_for_endpoint` to find handler
  2. Use `analyze_controller_method` to see parameters
  3. Use `build_method_call_chain` to see call flow
  4. Use `trace_endpoint_to_repository` to complete picture
- **Validation:** Consistent data across tools

**INT-2: Refactoring Support**
- **Test:** Rename method and find all usages
  1. Use `find_all_usages` to find references
  2. Use `build_method_call_chain` to see impacts
- **Validation:** All references identified

**INT-3: Test Generation Support**
- **Test:** Generate test for service method
  1. Use `get_method_body` to see implementation
  2. Use `find_mockable_dependencies` to identify mocks
  3. Use `find_execution_branches` to cover all paths
- **Validation:** Complete test context

---

## Regression Tests

### Regression Test Suite

Create suite of previously found bugs/issues and ensure they remain fixed:
- **REG-1:** Method overloading handled correctly
- **REG-2:** Generic types preserved
- **REG-3:** Kotlin files skipped gracefully
- **REG-4:** Large files don't cause memory issues
- **REG-5:** Unicode in class/method names handled

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] All packages built successfully
- [ ] Java parser service JAR created
- [ ] Test Spring Boot project accessible
- [ ] Test data prepared (various endpoints, classes, etc.)

### Execution Order
1. [ ] Run Micro Context tests (Phase 2)
2. [ ] Run Macro Context tests (Phase 3)
3. [ ] Run Component Context tests (Phase 4)
4. [ ] Run Performance tests
5. [ ] Run Error Handling tests
6. [ ] Run Integration tests

### Success Criteria
- [ ] 90%+ tests passing
- [ ] All critical paths working
- [ ] No crashes or unhandled exceptions
- [ ] Performance within acceptable limits
- [ ] Error messages clear and helpful

### Test Report Template
```markdown
## Test Execution Report

**Date:** [DATE]
**Tester:** [NAME]
**Environment:** [Java/Node versions]

### Results Summary
- Total Tests: X
- Passed: X
- Failed: X
- Skipped: X

### Failed Tests
1. [Test ID] - [Reason] - [Severity: Critical/High/Medium/Low]

### Performance Results
- Average execution time: X seconds
- Peak memory usage: X MB

### Issues Found
1. [Issue description] - [Component] - [Priority]

### Recommendations
1. [Recommendation]
```

---

## Automated Testing Setup (Future)

### Unit Tests
Create Jest/JUnit tests for:
- TypeScript tool wrappers
- Java parser methods
- Edge case handling

### Integration Tests
Create automated integration tests:
- Test with sample Spring Boot project
- Mock JavaParserClient responses
- Validate output format

### CI/CD Pipeline
Set up automated testing on:
- Pull requests
- Main branch commits
- Pre-release validation

---

## Notes

- All tests should be run against multiple Spring Boot versions (2.x and 3.x)
- Test with both Maven and Gradle projects
- Consider testing with Kotlin Spring projects (should gracefully handle)
- Document any limitations discovered during testing
- Update this test plan as new edge cases are discovered
