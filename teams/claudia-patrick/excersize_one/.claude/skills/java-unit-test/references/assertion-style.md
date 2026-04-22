# Assertion Style

## Prefer AssertJ

Use AssertJ fluent assertions over JUnit's `assertEquals` or Hamcrest matchers.

```java
// Preferred - AssertJ
assertThat(expense.getAmount()).isEqualTo(Money.of(42));
assertThat(expenses).hasSize(3);
assertThat(budget.isOverBudget()).isTrue();

// Avoid - JUnit assertions
assertEquals(Money.of(42), expense.getAmount());
assertTrue(budget.isOverBudget());
```

## Soft Assertions

When verifying multiple properties of the same object, use soft assertions so all
failures are reported at once rather than stopping at the first:

```java
@Test
@DisplayName("createExpense populates all fields correctly")
void createExpense_populatesAllFieldsCorrectly() {
    // given / when
    var expense = expenseService.create("Lunch", Money.of(15), Category.FOOD);

    // then
    SoftAssertions.assertSoftly(softly -> {
        softly.assertThat(expense.getDescription()).isEqualTo("Lunch");
        softly.assertThat(expense.getAmount()).isEqualTo(Money.of(15));
        softly.assertThat(expense.getCategory()).isEqualTo(Category.FOOD);
    });
}
```

## Exception Testing

Use `assertThatThrownBy` for clear, inline exception assertions:

```java
assertThatThrownBy(() -> service.withdraw(Money.of(1000)))
        .isInstanceOf(InsufficientFundsException.class)
        .hasMessageContaining("insufficient");
```

## Collection Assertions

AssertJ has rich collection support — use it:

```java
assertThat(expenses)
        .hasSize(2)
        .extracting(Expense::getCategory)
        .containsExactlyInAnyOrder(Category.FOOD, Category.TRANSPORT);
```
