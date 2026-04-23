package com.boniluca.finance.application.port.in;

import com.boniluca.finance.domain.model.Expense;

public interface RecordExpense {
    void record(Expense expense);
}
