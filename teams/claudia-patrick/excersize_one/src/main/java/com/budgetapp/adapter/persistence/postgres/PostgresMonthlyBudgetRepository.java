package com.budgetapp.adapter.persistence.postgres;

import com.budgetapp.adapter.persistence.postgres.jpa.MonthlyBudgetJpaRepository;
import com.budgetapp.core.domain.model.MonthlyBudget;
import com.budgetapp.core.port.MonthlyBudgetRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class PostgresMonthlyBudgetRepository implements MonthlyBudgetRepository {

    private final MonthlyBudgetJpaRepository jpaRepository;

    public PostgresMonthlyBudgetRepository(MonthlyBudgetJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public MonthlyBudget save(MonthlyBudget budget) {
        return EntityToModelMapper.toModel(
                jpaRepository.save(ModelToEntityMapper.toEntity(budget)));
    }

    @Override
    public Optional<MonthlyBudget> findByYearAndMonth(int year, int month) {
        return jpaRepository.findByYearAndMonth(year, month)
                .map(EntityToModelMapper::toModel);
    }

    @Override
    public List<MonthlyBudget> findAllOrderByYearDescMonthDesc() {
        return jpaRepository.findAllByOrderByYearDescMonthDesc().stream()
                .map(EntityToModelMapper::toModel)
                .toList();
    }
}
