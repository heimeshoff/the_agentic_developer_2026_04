package com.budgetapp.adapter.persistence.postgres.jpa;

import com.budgetapp.adapter.persistence.postgres.model.SkippedOccurrenceEntity;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkippedOccurrenceJpaRepository extends JpaRepository<SkippedOccurrenceEntity, Long> {

    boolean existsByRecurringExpenseIdAndDate(Long recurringExpenseId, LocalDate date);
}
