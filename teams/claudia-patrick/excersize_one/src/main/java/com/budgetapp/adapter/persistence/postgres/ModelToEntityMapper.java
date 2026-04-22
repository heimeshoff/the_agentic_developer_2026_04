package com.budgetapp.adapter.persistence.postgres;

import com.budgetapp.adapter.persistence.postgres.model.ExpenseEntity;
import com.budgetapp.adapter.persistence.postgres.model.MonthlyBudgetEntity;
import com.budgetapp.adapter.persistence.postgres.model.RecurringExpenseEntity;
import com.budgetapp.adapter.persistence.postgres.model.SkippedOccurrenceEntity;
import com.budgetapp.core.domain.model.Expense;
import com.budgetapp.core.domain.model.MonthlyBudget;
import com.budgetapp.core.domain.model.RecurringExpense;
import com.budgetapp.core.domain.model.SkippedOccurrence;

public final class ModelToEntityMapper {

    private ModelToEntityMapper() {
    }

    public static ExpenseEntity toEntity(Expense model) {
        return new ExpenseEntity(model.id(), model.description(), model.amount(),
                model.date(), model.category(), model.recurringExpenseId());
    }

    public static MonthlyBudgetEntity toEntity(MonthlyBudget model) {
        return new MonthlyBudgetEntity(model.id(), model.year(), model.month(), model.amount());
    }

    public static RecurringExpenseEntity toEntity(RecurringExpense model) {
        return new RecurringExpenseEntity(model.id(), model.description(), model.amount(),
                model.category(), model.interval(), model.startDate(),
                model.endDate(), model.active());
    }

    public static SkippedOccurrenceEntity toEntity(SkippedOccurrence model) {
        return new SkippedOccurrenceEntity(model.id(), model.recurringExpenseId(), model.date());
    }
}
