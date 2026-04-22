package com.budgetapp.adapter.persistence.postgres;

import com.budgetapp.adapter.persistence.postgres.model.ExpenseEntity;
import com.budgetapp.adapter.persistence.postgres.model.MonthlyBudgetEntity;
import com.budgetapp.adapter.persistence.postgres.model.RecurringExpenseEntity;
import com.budgetapp.adapter.persistence.postgres.model.SkippedOccurrenceEntity;
import com.budgetapp.core.domain.model.Expense;
import com.budgetapp.core.domain.model.MonthlyBudget;
import com.budgetapp.core.domain.model.RecurringExpense;
import com.budgetapp.core.domain.model.SkippedOccurrence;

public final class EntityToModelMapper {

    private EntityToModelMapper() {
    }

    public static Expense toModel(ExpenseEntity entity) {
        return new Expense(entity.getId(), entity.getDescription(), entity.getAmount(),
                entity.getDate(), entity.getCategory(), entity.getRecurringExpenseId());
    }

    public static MonthlyBudget toModel(MonthlyBudgetEntity entity) {
        return new MonthlyBudget(entity.getId(), entity.getYear(), entity.getMonth(), entity.getAmount());
    }

    public static RecurringExpense toModel(RecurringExpenseEntity entity) {
        return new RecurringExpense(entity.getId(), entity.getDescription(), entity.getAmount(),
                entity.getCategory(), entity.getInterval(), entity.getStartDate(),
                entity.getEndDate(), entity.isActive());
    }

    public static SkippedOccurrence toModel(SkippedOccurrenceEntity entity) {
        return new SkippedOccurrence(entity.getId(), entity.getRecurringExpenseId(), entity.getDate());
    }
}
