package com.budgetapp.core.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record Expense(Long id, String description, BigDecimal amount, LocalDate date,
                      ExpenseCategory category, Long recurringExpenseId) {

    public Expense(String description, BigDecimal amount, LocalDate date, ExpenseCategory category) {
        this(null, description, amount, date, category, null);
    }

    public Expense withRecurringExpenseId(Long recurringExpenseId) {
        return new Expense(id, description, amount, date, category, recurringExpenseId);
    }
}
