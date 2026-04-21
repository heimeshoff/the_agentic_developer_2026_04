# Test Data Builders (TestFixtures)

## Overview

When tests need domain model instances, use builder methods in a shared
`TestFixtures` class instead of scattering construction logic across test classes.

## Setup

In `src/test/java`, create `TestFixtures.java` in the same package as the domain
model if that file does not already exist. Keep all fixture builders in this one
file to avoid duplication.

## Example

Given the following domain class:

```java
public class Expense {
    private String description;
    private Money amount;
    private Category category;
    private LocalDate date;

    // constructor, getters ...
}
```

Create a builder-style fixture:

```java
package com.budgetapp;

import java.time.LocalDate;

public final class TestFixtures {

    private TestFixtures() {}

    public static ExpenseBuilder anExpense() {
        return new ExpenseBuilder();
    }

    public static class ExpenseBuilder {
        private String description = "Coffee";
        private Money amount = Money.of(5);
        private Category category = Category.FOOD;
        private LocalDate date = LocalDate.of(2026, 1, 15);

        public ExpenseBuilder withDescription(String description) {
            this.description = description;
            return this;
        }

        public ExpenseBuilder withAmount(Money amount) {
            this.amount = amount;
            return this;
        }

        public ExpenseBuilder withCategory(Category category) {
            this.category = category;
            return this;
        }

        public ExpenseBuilder withDate(LocalDate date) {
            this.date = date;
            return this;
        }

        public Expense build() {
            return new Expense(description, amount, category, date);
        }
    }
}
```

## Usage

When the details do not matter, use defaults:

```java
var expense = anExpense().build();
```

When specific fields matter for the scenario:

```java
var expense = anExpense()
        .withCategory(Category.TRANSPORT)
        .withAmount(Money.of(50))
        .build();
```

## Guidelines

* One builder per domain model class.
* Defaults should produce a valid, representative instance.
* Only add `with*` methods for fields that tests actually vary.
* Prefer builders over constructor calls with many arguments.
* For simple value objects (e.g., `Money`), a static factory is fine — no builder needed.
