package com.boniluca.finance.application;

import com.boniluca.finance.application.port.in.RecordExpense;
import com.boniluca.finance.application.port.out.DebtRepository;
import com.boniluca.finance.application.port.out.ExpenseRepository;
import com.boniluca.finance.domain.model.Expense;

public class ExpenseService implements RecordExpense {

    private final ExpenseRepository expenses;
    private final DebtRepository debts;

    public ExpenseService(ExpenseRepository expenses, DebtRepository debts) {
        this.expenses = expenses;
        this.debts = debts;
    }

    @Override
    public void record(Expense expense) {
        expenses.append(expense);
        debts.save(debts.load().increasedBy(expense.amount()));
    }
}
