package com.budgetapp.core.service;

import com.budgetapp.core.domain.model.Expense;
import com.budgetapp.core.domain.model.ExpenseCategory;
import com.budgetapp.core.port.ExpenseRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    public Expense addExpense(String description, BigDecimal amount, LocalDate date, ExpenseCategory category) {
        return expenseRepository.save(new Expense(description, amount, date, category));
    }

    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }

    public Optional<Expense> findById(Long id) {
        return expenseRepository.findById(id);
    }

    public List<Expense> getMonthlyExpenses(LocalDate start, LocalDate end) {
        return expenseRepository.findByDateBetweenOrderByDateDesc(start, end);
    }

    public Map<ExpenseCategory, BigDecimal> getCategoryTotals(LocalDate start, LocalDate end) {
        return expenseRepository.sumByCategory(start, end);
    }
}
