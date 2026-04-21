# Test Method Naming Examples

Use the pattern: `testedMethod_expectedBehavior_whenCondition`.

Add a `@DisplayName` annotation with a human-readable sentence.

```java
@Test
@DisplayName("cancel sets status to CANCELED when order has not been shipped")
void cancel_setsStatusToCanceled_whenOrderHasNotBeenShipped() {
    // ...
}
```

```java
@Test
@DisplayName("cancel throws IllegalStateException when order has already been shipped")
void cancel_throwsIllegalStateException_whenOrderHasAlreadyBeenShipped() {
    // ...
}
```

```java
@Test
@DisplayName("calculateTotal returns sum of all line item amounts")
void calculateTotal_returnsSumOfAllLineItemAmounts() {
    // ...
}
```

For parameterized tests, name the method after the general scenario:

```java
@ParameterizedTest
@DisplayName("isValid returns false for invalid email formats")
@ValueSource(strings = {"no-at-sign", "@missing-local", "spaces in@email.com"})
void isValid_returnsFalse_forInvalidEmailFormats(String email) {
    // ...
}
```
