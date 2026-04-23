package com.boniluca.finance.application;

import com.boniluca.finance.application.port.out.DebtRepository;
import com.boniluca.finance.application.port.out.ExpenseRepository;
import com.boniluca.finance.domain.model.Category;
import com.boniluca.finance.domain.model.Debt;
import com.boniluca.finance.domain.model.Expense;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ExpenseServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 4, 23);

    @Test
    void appendsExpenseAndGrowsDebt() {
        RecordingExpenseRepo expenseRepo = new RecordingExpenseRepo();
        InMemoryDebtRepo debtRepo = new InMemoryDebtRepo(new Debt(new BigDecimal("27376.35")));
        ExpenseService service = new ExpenseService(expenseRepo, debtRepo);

        Expense expense = Expense.of(new BigDecimal("12.50"), Category.FOOD, TODAY, "lunch");
        service.record(expense);

        assertThat(expenseRepo.appended).containsExactly(expense);
        assertThat(debtRepo.current.balance()).isEqualByComparingTo("27388.85");
    }

    @Test
    void appendsExpenseBeforeSavingDebt() {
        OrderTrackingExpenseRepo expenseRepo = new OrderTrackingExpenseRepo();
        OrderTrackingDebtRepo debtRepo = new OrderTrackingDebtRepo(new Debt(new BigDecimal("100")));
        List<String> ops = new ArrayList<>();
        expenseRepo.log = ops;
        debtRepo.log = ops;
        ExpenseService service = new ExpenseService(expenseRepo, debtRepo);

        service.record(Expense.of(new BigDecimal("5"), Category.FOOD, TODAY, null));

        assertThat(ops).containsExactly("append", "load", "save");
    }

    private static final class RecordingExpenseRepo implements ExpenseRepository {
        final List<Expense> appended = new ArrayList<>();

        @Override
        public void append(Expense expense) {
            appended.add(expense);
        }
    }

    private static final class InMemoryDebtRepo implements DebtRepository {
        Debt current;

        InMemoryDebtRepo(Debt initial) {
            this.current = initial;
        }

        @Override
        public Debt load() {
            return current;
        }

        @Override
        public void save(Debt debt) {
            this.current = debt;
        }
    }

    private static final class OrderTrackingExpenseRepo implements ExpenseRepository {
        List<String> log;

        @Override
        public void append(Expense expense) {
            log.add("append");
        }
    }

    private static final class OrderTrackingDebtRepo implements DebtRepository {
        List<String> log;
        Debt current;

        OrderTrackingDebtRepo(Debt initial) {
            this.current = initial;
        }

        @Override
        public Debt load() {
            log.add("load");
            return current;
        }

        @Override
        public void save(Debt debt) {
            log.add("save");
            this.current = debt;
        }
    }
}
