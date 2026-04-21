package com.budgetapp.adapter.persistence.postgres;

import com.budgetapp.adapter.persistence.postgres.jpa.RecurringExpenseJpaRepository;
import com.budgetapp.core.domain.model.RecurringExpense;
import com.budgetapp.core.port.RecurringExpenseRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class PostgresRecurringExpenseRepository implements RecurringExpenseRepository {

    private final RecurringExpenseJpaRepository jpaRepository;

    public PostgresRecurringExpenseRepository(RecurringExpenseJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public RecurringExpense save(RecurringExpense recurringExpense) {
        return EntityToModelMapper.toModel(
                jpaRepository.save(ModelToEntityMapper.toEntity(recurringExpense)));
    }

    @Override
    public Optional<RecurringExpense> findById(Long id) {
        return jpaRepository.findById(id).map(EntityToModelMapper::toModel);
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public List<RecurringExpense> findByActiveTrue() {
        return jpaRepository.findByActiveTrue().stream()
                .map(EntityToModelMapper::toModel)
                .toList();
    }

    @Override
    public List<RecurringExpense> findAllOrderByStartDateDesc() {
        return jpaRepository.findAllByOrderByStartDateDesc().stream()
                .map(EntityToModelMapper::toModel)
                .toList();
    }
}
