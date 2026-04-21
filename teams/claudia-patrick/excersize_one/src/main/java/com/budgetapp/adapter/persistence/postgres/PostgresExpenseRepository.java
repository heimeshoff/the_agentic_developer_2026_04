package com.budgetapp.adapter.persistence.postgres;

import com.budgetapp.adapter.persistence.postgres.jpa.ExpenseJpaRepository;
import com.budgetapp.core.domain.model.Expense;
import com.budgetapp.core.domain.model.ExpenseCategory;
import com.budgetapp.core.port.ExpenseRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class PostgresExpenseRepository implements ExpenseRepository {

    private final ExpenseJpaRepository jpaRepository;

    public PostgresExpenseRepository(ExpenseJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Expense save(Expense expense) {
        return EntityToModelMapper.toModel(
                jpaRepository.save(ModelToEntityMapper.toEntity(expense)));
    }

    @Override
    public Optional<Expense> findById(Long id) {
        return jpaRepository.findById(id).map(EntityToModelMapper::toModel);
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public List<Expense> findByDateBetweenOrderByDateDesc(LocalDate start, LocalDate end) {
        return jpaRepository.findByDateBetweenOrderByDateDescIdDesc(start, end).stream()
                .map(EntityToModelMapper::toModel)
                .toList();
    }

    @Override
    public Map<ExpenseCategory, BigDecimal> sumByCategory(LocalDate start, LocalDate end) {
        Map<ExpenseCategory, BigDecimal> totals = new LinkedHashMap<>();
        for (Object[] row : jpaRepository.sumByCategory(start, end)) {
            totals.put((ExpenseCategory) row[0], (BigDecimal) row[1]);
        }
        return totals;
    }

    @Override
    public boolean existsByRecurringExpenseIdAndDate(Long recurringExpenseId, LocalDate date) {
        return jpaRepository.existsByRecurringExpenseIdAndDate(recurringExpenseId, date);
    }

    @Override
    public List<Expense> findByRecurringExpenseId(Long recurringExpenseId) {
        return jpaRepository.findByRecurringExpenseId(recurringExpenseId).stream()
                .map(EntityToModelMapper::toModel)
                .toList();
    }
}
