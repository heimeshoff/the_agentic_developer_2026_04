package com.budgetapp.adapter.persistence.postgres;

import com.budgetapp.adapter.persistence.postgres.jpa.SkippedOccurrenceJpaRepository;
import com.budgetapp.core.domain.model.SkippedOccurrence;
import com.budgetapp.core.port.SkippedOccurrenceRepository;
import java.time.LocalDate;
import org.springframework.stereotype.Component;

@Component
public class PostgresSkippedOccurrenceRepository implements SkippedOccurrenceRepository {

    private final SkippedOccurrenceJpaRepository jpaRepository;

    public PostgresSkippedOccurrenceRepository(SkippedOccurrenceJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public SkippedOccurrence save(SkippedOccurrence skippedOccurrence) {
        return EntityToModelMapper.toModel(
                jpaRepository.save(ModelToEntityMapper.toEntity(skippedOccurrence)));
    }

    @Override
    public boolean existsByRecurringExpenseIdAndDate(Long recurringExpenseId, LocalDate date) {
        return jpaRepository.existsByRecurringExpenseIdAndDate(recurringExpenseId, date);
    }
}
