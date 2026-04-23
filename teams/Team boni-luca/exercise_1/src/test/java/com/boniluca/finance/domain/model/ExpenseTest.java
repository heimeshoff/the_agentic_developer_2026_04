package com.boniluca.finance.domain.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ExpenseTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 4, 23);

    @Test
    void holdsAllFields() {
        Expense expense = Expense.of(new BigDecimal("12.50"), Category.FOOD, TODAY, "lunch");

        assertThat(expense.amount()).isEqualByComparingTo("12.50");
        assertThat(expense.category()).isEqualTo(Category.FOOD);
        assertThat(expense.date()).isEqualTo(TODAY);
        assertThat(expense.description()).contains("lunch");
    }

    @Test
    void trimsDescription() {
        Expense expense = Expense.of(new BigDecimal("1"), Category.FOOD, TODAY, "  lunch  ");

        assertThat(expense.description()).contains("lunch");
    }

    @Test
    void blankDescriptionBecomesEmpty() {
        Expense expense = Expense.of(new BigDecimal("1"), Category.FOOD, TODAY, "   ");

        assertThat(expense.description()).isEmpty();
    }

    @Test
    void nullDescriptionBecomesEmpty() {
        Expense expense = Expense.of(new BigDecimal("1"), Category.FOOD, TODAY, null);

        assertThat(expense.description()).isEmpty();
    }

    @Test
    void rejectsZeroAmount() {
        assertThatThrownBy(() -> Expense.of(BigDecimal.ZERO, Category.FOOD, TODAY, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsNegativeAmount() {
        assertThatThrownBy(() -> Expense.of(new BigDecimal("-1"), Category.FOOD, TODAY, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsNullAmount() {
        assertThatThrownBy(() -> new Expense(null, Category.FOOD, TODAY, Optional.empty()))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    void rejectsNullCategory() {
        assertThatThrownBy(() -> new Expense(new BigDecimal("1"), null, TODAY, Optional.empty()))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    void rejectsNullDate() {
        assertThatThrownBy(() -> new Expense(new BigDecimal("1"), Category.FOOD, null, Optional.empty()))
                .isInstanceOf(NullPointerException.class);
    }
}
