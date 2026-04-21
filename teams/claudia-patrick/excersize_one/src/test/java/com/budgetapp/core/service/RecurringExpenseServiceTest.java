package com.budgetapp.core.service;

import com.budgetapp.core.domain.model.ExpenseCategory;
import com.budgetapp.core.domain.model.RecurrenceInterval;
import com.budgetapp.core.domain.model.RecurringExpense;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RecurringExpenseServiceTest {

    @Test
    void calculateMonthlyOccurrenceDates() {
        var recurring = new RecurringExpense(
                "Rent", new BigDecimal("1200.00"), ExpenseCategory.HOUSING,
                RecurrenceInterval.MONTHLY,
                LocalDate.of(2026, 1, 15), null
        );

        List<LocalDate> dates = RecurringExpenseService.calculateOccurrenceDates(
                recurring, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 4, 30));

        assertEquals(List.of(
                LocalDate.of(2026, 1, 15),
                LocalDate.of(2026, 2, 15),
                LocalDate.of(2026, 3, 15),
                LocalDate.of(2026, 4, 15)
        ), dates);
    }

    @Test
    void calculateWeeklyOccurrenceDates() {
        var recurring = new RecurringExpense(
                "Coffee", new BigDecimal("5.00"), ExpenseCategory.FOOD,
                RecurrenceInterval.WEEKLY,
                LocalDate.of(2026, 3, 2), null
        );

        List<LocalDate> dates = RecurringExpenseService.calculateOccurrenceDates(
                recurring, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31));

        assertEquals(List.of(
                LocalDate.of(2026, 3, 2),
                LocalDate.of(2026, 3, 9),
                LocalDate.of(2026, 3, 16),
                LocalDate.of(2026, 3, 23),
                LocalDate.of(2026, 3, 30)
        ), dates);
    }

    @Test
    void calculateYearlyOccurrenceDates() {
        var recurring = new RecurringExpense(
                "Insurance", new BigDecimal("600.00"), ExpenseCategory.HEALTH,
                RecurrenceInterval.YEARLY,
                LocalDate.of(2024, 6, 1), null
        );

        List<LocalDate> dates = RecurringExpenseService.calculateOccurrenceDates(
                recurring, LocalDate.of(2025, 1, 1), LocalDate.of(2027, 12, 31));

        assertEquals(List.of(
                LocalDate.of(2025, 6, 1),
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2027, 6, 1)
        ), dates);
    }

    @Test
    void respectsEndDate() {
        var recurring = new RecurringExpense(
                "Gym", new BigDecimal("30.00"), ExpenseCategory.HEALTH,
                RecurrenceInterval.MONTHLY,
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 15)
        );

        List<LocalDate> dates = RecurringExpenseService.calculateOccurrenceDates(
                recurring, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 30));

        assertEquals(List.of(
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 2, 1),
                LocalDate.of(2026, 3, 1)
        ), dates);
    }

    @Test
    void startDateAfterRangeStartUsesStartDate() {
        var recurring = new RecurringExpense(
                "Netflix", new BigDecimal("15.99"), ExpenseCategory.ENTERTAINMENT,
                RecurrenceInterval.MONTHLY,
                LocalDate.of(2026, 3, 10), null
        );

        List<LocalDate> dates = RecurringExpenseService.calculateOccurrenceDates(
                recurring, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 5, 31));

        assertEquals(List.of(
                LocalDate.of(2026, 3, 10),
                LocalDate.of(2026, 4, 10),
                LocalDate.of(2026, 5, 10)
        ), dates);
    }

    @Test
    void inactiveRecurringExpenseProducesNoDates() {
        var recurring = new RecurringExpense(
                "Old Sub", new BigDecimal("10.00"), ExpenseCategory.OTHER,
                RecurrenceInterval.MONTHLY,
                LocalDate.of(2026, 1, 1), null
        );
        var deactivated = recurring.deactivate();

        List<LocalDate> dates = RecurringExpenseService.calculateOccurrenceDates(
                deactivated, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31));

        assertTrue(dates.isEmpty());
    }

    @Test
    void monthlyOnThe31stHandlesShortMonths() {
        var recurring = new RecurringExpense(
                "Rent", new BigDecimal("1200.00"), ExpenseCategory.HOUSING,
                RecurrenceInterval.MONTHLY,
                LocalDate.of(2026, 1, 31), null
        );

        List<LocalDate> dates = RecurringExpenseService.calculateOccurrenceDates(
                recurring, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 4, 30));

        assertEquals(List.of(
                LocalDate.of(2026, 1, 31),
                LocalDate.of(2026, 2, 28),
                LocalDate.of(2026, 3, 31),
                LocalDate.of(2026, 4, 30)
        ), dates);
    }
}
