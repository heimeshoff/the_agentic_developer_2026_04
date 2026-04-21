---
name: java-unit-test
description: >
    Rules for writing Java unit tests. Use this skill whenever you create or
    update unit tests in a Java project (`*Test`). Do not use this skill for
    integration tests (`*IT`) or Spring Boot context tests (`@SpringBootTest`).
---

## When to Use

Use this skill when the user asks to:

* create new Java unit tests
* refactor existing Java unit tests
* align Java test code with naming and structure conventions

Do not use this skill for integration tests or tests that require `@SpringBootTest`.

## Workflow

1. Identify the component under test and its dependencies.
2. Create or update the test class with the correct class name and package.
3. Write focused test methods using the required naming and structure rules.
4. Use test data builders for domain model test data when appropriate.
5. Run the tests with `./mvnw test -Dtest=ClassName` and verify they pass.

## Naming Rules

### Test classes

* Test classes must be named `<ProductionCodeClass>Test`.
  Example: production class `ExpenseService` -> test class `ExpenseServiceTest`.
* Test classes must be in the same package as the production code.
* Test classes must be located under `src/test/java`.

### Test method names

* Use `@DisplayName` for human-readable descriptions.
* Method names follow the pattern: `testedMethod_expectedBehavior_whenCondition`.
* See `references/test-method-naming.md` for examples.

## Test Structure Rules

* Structure each test method into `given`, `when`, and `then` sections.
* Mark those sections with comments.
* See `references/test-structure.md` for an example.

## Test Scope Rules

* One unit test method must cover exactly one scenario.
* A single test method may contain multiple assertions for that one scenario.
* Use `@ParameterizedTest` for multiple variants of the same scenario.
* Test public behavior, not implementation details or private methods.

## Component and Dependencies

* Instantiate the component under test as a field in the test class.
* Instantiate or mock dependencies as fields in the test class.
* Use `@ExtendWith(MockitoExtension.class)` and `@Mock` annotations for mocks.
* Use `@InjectMocks` to wire the component under test when it takes constructor dependencies.
* Mock only system boundaries (for example: repositories, external service clients, gateways).
* Prefer real value objects and simple fakes over deep mock chains.

## Library Preferences

Scan the project dependencies and prefer:

* JUnit Jupiter (JUnit 5) over JUnit 4
* Mockito over hand-rolled stubs (for system boundaries)
* AssertJ over Hamcrest or JUnit assertions

## Assertion Style

* Prefer AssertJ fluent assertions: `assertThat(actual).isEqualTo(expected)`.
* Use `SoftAssertions` or `assertSoftly` when verifying multiple related properties in one scenario.
* Use `assertThatThrownBy(() -> ...)` for exception testing.
* See `references/assertion-style.md` for examples.

## Model Test Data Builders

Use builder methods in a shared `TestFixtures` class when test data uses domain model types.
See `references/test-fixtures.md` for details.

## Spring-Specific Unit Tests

* For controller unit tests, use `@WebMvcTest(ControllerClass.class)` with `MockMvc`, not `@SpringBootTest`.
* For repository tests, use `@DataJpaTest`.
* For service tests, prefer plain unit tests with Mockito — no Spring context needed.
* See `references/spring-test-slices.md` for guidance.
