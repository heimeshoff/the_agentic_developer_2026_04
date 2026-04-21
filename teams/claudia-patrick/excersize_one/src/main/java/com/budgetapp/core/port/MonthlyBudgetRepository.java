package com.budgetapp.core.port;

import com.budgetapp.core.domain.model.MonthlyBudget;
import java.util.List;
import java.util.Optional;

public interface MonthlyBudgetRepository {

    MonthlyBudget save(MonthlyBudget budget);

    Optional<MonthlyBudget> findByYearAndMonth(int year, int month);

    List<MonthlyBudget> findAllOrderByYearDescMonthDesc();
}
