package com.budgetapp.core.domain.model;

import java.time.LocalDate;

public record SkippedOccurrence(Long id, Long recurringExpenseId, LocalDate date) {

    public SkippedOccurrence(Long recurringExpenseId, LocalDate date) {
        this(null, recurringExpenseId, date);
    }
}
