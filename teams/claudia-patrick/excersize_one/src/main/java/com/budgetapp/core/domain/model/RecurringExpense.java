package com.budgetapp.core.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringExpense(Long id, String description, BigDecimal amount,
                                ExpenseCategory category, RecurrenceInterval interval,
                                LocalDate startDate, LocalDate endDate, boolean active) {

    public RecurringExpense(String description, BigDecimal amount, ExpenseCategory category,
                            RecurrenceInterval interval, LocalDate startDate, LocalDate endDate) {
        this(null, description, amount, category, interval, startDate, endDate, true);
    }

    public RecurringExpense deactivate() {
        return new RecurringExpense(id, description, amount, category, interval, startDate, endDate, false);
    }
}
