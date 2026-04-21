package com.budgetapp.core.service;

import com.budgetapp.core.domain.model.MonthlyBudget;
import com.budgetapp.core.port.MonthlyBudgetRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class MonthlyBudgetService {

    private final MonthlyBudgetRepository repository;

    public MonthlyBudgetService(MonthlyBudgetRepository repository) {
        this.repository = repository;
    }

    public Optional<MonthlyBudget> findByYearAndMonth(int year, int month) {
        return repository.findByYearAndMonth(year, month);
    }

    public List<MonthlyBudget> findAll() {
        return repository.findAllOrderByYearDescMonthDesc();
    }

    public MonthlyBudget save(int year, int month, BigDecimal amount) {
        Optional<MonthlyBudget> existing = repository.findByYearAndMonth(year, month);
        if (existing.isPresent()) {
            return repository.save(existing.get().withAmount(amount));
        }
        return repository.save(new MonthlyBudget(year, month, amount));
    }
}
