package com.budgetapp.budget;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MonthlyBudgetRepository extends JpaRepository<MonthlyBudget, Long> {

    Optional<MonthlyBudget> findByYearAndMonth(int year, int month);

    List<MonthlyBudget> findAllByOrderByYearDescMonthDesc();
}
