package com.budgetapp.core.port;

import com.budgetapp.core.domain.model.Expense;
import com.budgetapp.core.domain.model.ExpenseCategory;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ExpenseRepository {

    Expense save(Expense expense);

    Optional<Expense> findById(Long id);

    void deleteById(Long id);

    List<Expense> findByDateBetweenOrderByDateDesc(LocalDate start, LocalDate end);

    Map<ExpenseCategory, BigDecimal> sumByCategory(LocalDate start, LocalDate end);

    boolean existsByRecurringExpenseIdAndDate(Long recurringExpenseId, LocalDate date);

    List<Expense> findByRecurringExpenseId(Long recurringExpenseId);
}
