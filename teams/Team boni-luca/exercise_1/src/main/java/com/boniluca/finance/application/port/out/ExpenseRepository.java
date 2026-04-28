package com.boniluca.finance.application.port.out;

import com.boniluca.finance.domain.model.Expense;

public interface ExpenseRepository {
    void append(Expense expense);
}
