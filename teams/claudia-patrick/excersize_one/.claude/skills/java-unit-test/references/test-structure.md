# Test Structure Example

Group unit test content into `given`, `when`, and `then` sections using comments.

```java
@Test
@DisplayName("cancel sets status to CANCELED when order has not been shipped")
void cancel_setsStatusToCanceled_whenOrderHasNotBeenShipped() {
    // given
    var order = anOrder().withStatus(OrderStatus.IN_PROGRESS).build();

    // when
    order.cancel();

    // then
    assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELED);
}
```

When the `given` section is trivial or empty, you may omit it:

```java
@Test
@DisplayName("new budget starts with zero spent amount")
void constructor_startsWithZeroSpentAmount() {
    // when
    var budget = new Budget("Groceries", Money.of(500));

    // then
    assertThat(budget.getSpent()).isEqualTo(Money.ZERO);
}
```

When a test verifies an exception:

```java
@Test
@DisplayName("addExpense throws when amount is negative")
void addExpense_throwsIllegalArgumentException_whenAmountIsNegative() {
    // given
    var budget = aBudget().build();

    // when / then
    assertThatThrownBy(() -> budget.addExpense(Money.of(-10)))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("negative");
}
```
