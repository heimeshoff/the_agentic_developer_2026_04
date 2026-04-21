package com.budgetapp.core.port;

import com.budgetapp.core.domain.model.SkippedOccurrence;

import java.time.LocalDate;

public interface SkippedOccurrenceRepository {

    SkippedOccurrence save(SkippedOccurrence skippedOccurrence);

    boolean existsByRecurringExpenseIdAndDate(Long recurringExpenseId, LocalDate date);
}
