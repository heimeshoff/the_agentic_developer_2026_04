package com.budgetapp.adapter.persistence.postgres.jpa;

import com.budgetapp.adapter.persistence.postgres.model.MonthlyBudgetEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MonthlyBudgetJpaRepository extends JpaRepository<MonthlyBudgetEntity, Long> {

    Optional<MonthlyBudgetEntity> findByYearAndMonth(int year, int month);

    List<MonthlyBudgetEntity> findAllByOrderByYearDescMonthDesc();
}
