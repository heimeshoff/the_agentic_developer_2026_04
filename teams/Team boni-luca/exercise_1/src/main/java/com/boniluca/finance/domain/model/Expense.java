package com.boniluca.finance.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;
import java.util.Optional;

public record Expense(BigDecimal amount, Category category, LocalDate date, Optional<String> description) {
    public Expense {
        Objects.requireNonNull(amount, "amount");
        Objects.requireNonNull(category, "category");
        Objects.requireNonNull(date, "date");
        Objects.requireNonNull(description, "description");
        if (amount.signum() <= 0) {
            throw new IllegalArgumentException("amount must be positive: " + amount.toPlainString());
        }
        description = description.map(String::trim).filter(s -> !s.isEmpty());
    }

    public static Expense of(BigDecimal amount, Category category, LocalDate date, String description) {
        return new Expense(amount, category, date, Optional.ofNullable(description));
    }
}
