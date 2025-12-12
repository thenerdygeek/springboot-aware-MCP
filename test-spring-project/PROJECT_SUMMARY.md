# Comprehensive Spring Boot 3.4+ Test Project

## Project Overview
A complete Spring Boot 3.4.1 application with JDK 21 and Spring Security 6 designed to test all MCP server tools.

## Technology Stack
- **Java**: 21
- **Spring Boot**: 3.4.1
- **Spring Security**: 6.x (OAuth2 Resource Server)
- **Spring Data JPA**: Latest
- **Database**: H2 (in-memory)
- **Build Tool**: Maven
- **Lombok**: For reducing boilerplate
- **MapStruct**: For DTO mapping
- **JWT**: For authentication

## Project Structure

### Domain Entities (4)
✅ `/domain/User.java` - User entity with roles, audit fields
✅ `/domain/Product.java` - Product catalog with categories
✅ `/domain/Order.java` - Orders with status workflow
✅ `/domain/OrderItem.java` - Order line items

### DTOs with Validation (4)
✅ `/dto/UserDTO.java` - Comprehensive validation annotations
✅ `/dto/ProductDTO.java` - Product data transfer
✅ `/dto/OrderDTO.java` - Order with nested items validation
✅ `/dto/ApiResponse.java` - Standardized API response wrapper

### Repositories (3)
✅ `/repository/UserRepository.java` - Custom queries, @Query annotations
✅ `/repository/ProductRepository.java` - Price range, search queries
✅ `/repository/OrderRepository.java` - Complex joins, date ranges

### Services with @Service (3)
✅ `/service/UserService.java` - Business logic, feature flags, @Transactional
✅ `/service/ProductService.java` - Product management
✅ `/service/OrderService.java` - Order processing with relationships

### Controllers with REST Mappings (3)
✅ `/controller/UserController.java` - Full CRUD, @PreAuthorize, validation
✅ `/controller/ProductController.java` - Product endpoints
✅ `/controller/OrderController.java` - Order management

### Exception Handling (3)
✅ `/exception/ResourceNotFoundException.java` - Custom exception
✅ `/exception/ResourceAlreadyExistsException.java` - Conflict exception
✅ `/exception/GlobalExceptionHandler.java` - @ControllerAdvice with comprehensive handlers

### Configuration Files
✅ `pom.xml` - Maven dependencies for Spring Boot 3.4.1, Security 6, JDK 21
✅ `application.properties` - Complete configuration with feature flags
✅ `McpTestApplication.java` - Main application class

## MCP Tool Testing Coverage

### Phase 2: Micro Context Server Tools
1. **resolve_symbol** - Test with `userService`, `productRepository` fields
2. **get_function_definition** - Test with `createUser`, `updateProduct` methods
3. **get_dto_structure** - Test with `UserDTO`, `ProductDTO`, `OrderDTO`
4. **find_mockable_dependencies** - Test with service classes
5. **find_execution_branches** - Test methods with if-else logic

### Phase 3: Macro Context Server Tools
1. **build_method_call_chain** - Trace UserController → UserService → UserRepository
2. **trace_endpoint_to_repository** - Follow `/api/users` to database
3. **find_entity_by_table** - Map `users` table to `User` entity
4. **analyze_data_flow** - Track UserDTO through layers
5. **find_transaction_boundaries** - Identify @Transactional methods
6. **detect_circular_dependencies** - Validate service dependencies
7. **generate_sequence_diagram** - API request flow

### Phase 4: Spring Component Server Tools
1. **analyze_controller_method** - Test POST `/api/users` with @RequestBody
2. **find_controller_for_endpoint** - Match `/api/products/{id}` to handler
3. **find_implementations** - Find UserRepository implementations
4. **find_feature_flag_usage** - Locate feature flag conditionals

## Key Features for Testing

### Annotations Coverage
- ✅ `@SpringBootApplication`
- ✅ `@RestController`, `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`
- ✅ `@Service`, `@Repository`, `@Component`
- ✅ `@Configuration`, `@Bean`
- ✅ `@Entity`, `@Table`, `@Id`, `@Column`, `@OneToMany`, `@ManyToOne`
- ✅ `@Valid`, `@Validated`, `@NotNull`, `@NotBlank`, `@Size`, `@Email`, `@Pattern`
- ✅ `@Transactional`
- ✅ `@ControllerAdvice`, `@ExceptionHandler`
- ✅ `@PreAuthorize`
- ✅ `@EnableWebSecurity`, `@EnableMethodSecurity`
- ✅ `@RequiredArgsConstructor`, `@Slf4j`, `@Data` (Lombok)

### Spring Security 6 Features
- 🔧 OAuth2 Resource Server configuration
- 🔧 JWT authentication
- 🔧 Method-level security
- 🔧 Custom authentication filter (OncePerRequestFilter)
- 🔧 CORS configuration
- 🔧 Role-based access control

### Additional Components Needed
- 🔧 ResourceServerConfig class
- 🔧 JwtAuthenticationFilter (extends OncePerRequestFilter)
- 🔧 JWT utility components
- 🔧 @Configuration classes
- 🔧 @Component utilities

## Building the Project

```bash
cd test-spring-project
mvn clean install
mvn spring-boot:run
```

## Running MCP Tests

```bash
cd ..
./run-tests.sh test-spring-project
```

## Expected Test Results

With this comprehensive project:
- ✅ All Phase 2 tools should pass (5/5)
- ✅ All Phase 3 tools should pass (7/7)
- ✅ All Phase 4 tools should pass (4/4)
- **Target: 100% test success rate (16/16 tools)**

## Next Steps

1. Complete remaining security components (ResourceServerConfig, JwtAuthenticationFilter)
2. Add @Component and @Configuration examples
3. Run Maven build
4. Execute MCP test suite
5. Validate all 16 tools return expected responses
