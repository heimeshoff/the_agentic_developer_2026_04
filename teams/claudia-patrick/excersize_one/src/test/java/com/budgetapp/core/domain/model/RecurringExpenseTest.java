package com.budgetapp.core.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RecurringExpenseTest {

    @Test
    void createRecurringExpenseWithAllFields() {
        var recurring = new RecurringExpense(
                "Netflix",
                new BigDecimal("15.99"),
                ExpenseCategory.ENTERTAINMENT,
                RecurrenceInterval.MONTHLY,
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 12, 31)
        );

        assertEquals("Netflix", recurring.description());
        assertEquals(new BigDecimal("15.99"), recurring.amount());
        assertEquals(ExpenseCategory.ENTERTAINMENT, recurring.category());
        assertEquals(RecurrenceInterval.MONTHLY, recurring.interval());
        assertEquals(LocalDate.of(2026, 1, 1), recurring.startDate());
        assertEquals(LocalDate.of(2026, 12, 31), recurring.endDate());
        assertTrue(recurring.active());
    }

    @Test
    void createRecurringExpenseWithoutEndDate() {
        var recurring = new RecurringExpense(
                "Rent",
                new BigDecimal("1200.00"),
                ExpenseCategory.HOUSING,
                RecurrenceInterval.MONTHLY,
                LocalDate.of(2026, 1, 1),
                null
        );

        assertNull(recurring.endDate());
        assertTrue(recurring.active());
    }

    @Test
    void deactivateRecurringExpense() {
        var recurring = new RecurringExpense(
                "Gym",
                new BigDecimal("30.00"),
                ExpenseCategory.HEALTH,
                RecurrenceInterval.MONTHLY,
                LocalDate.of(2026, 1, 1),
                null
        );

        var deactivated = recurring.deactivate();

        assertFalse(deactivated.active());
    }
}
