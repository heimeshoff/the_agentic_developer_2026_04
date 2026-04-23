package com.boniluca.finance;

import com.boniluca.finance.application.DebtService;
import com.boniluca.finance.application.ExpenseService;
import com.boniluca.finance.application.port.in.GetCurrentDebt;
import com.boniluca.finance.application.port.in.RecordExpense;
import com.boniluca.finance.application.port.out.DebtRepository;
import com.boniluca.finance.application.port.out.ExpenseRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class FinanceApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinanceApplication.class, args);
    }

    @Bean
    GetCurrentDebt getCurrentDebt(DebtRepository repository) {
        return new DebtService(repository);
    }

    @Bean
    RecordExpense recordExpense(ExpenseRepository expenses, DebtRepository debts) {
        return new ExpenseService(expenses, debts);
    }
}
