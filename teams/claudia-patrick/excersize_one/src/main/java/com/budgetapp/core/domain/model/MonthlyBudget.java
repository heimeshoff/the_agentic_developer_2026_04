package com.budgetapp.core.domain.model;

import java.math.BigDecimal;

public record MonthlyBudget(Long id, int year, int month, BigDecimal amount) {

    public MonthlyBudget(int year, int month, BigDecimal amount) {
        this(null, year, month, amount);
    }

    public String monthName() {
        return java.time.Month.of(month).name().charAt(0)
                + java.time.Month.of(month).name().substring(1).toLowerCase();
    }

    public MonthlyBudget withAmount(BigDecimal newAmount) {
        return new MonthlyBudget(id, year, month, newAmount);
    }
}
