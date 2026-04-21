package com.budgetapp.core.port;

import com.budgetapp.core.domain.model.RecurringExpense;
import java.util.List;
import java.util.Optional;

public interface RecurringExpenseRepository {

    RecurringExpense save(RecurringExpense recurringExpense);

    Optional<RecurringExpense> findById(Long id);

    void deleteById(Long id);

    List<RecurringExpense> findByActiveTrue();

    List<RecurringExpense> findAllOrderByStartDateDesc();
}
