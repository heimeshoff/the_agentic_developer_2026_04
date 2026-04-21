package com.boniluca.finance.application;

import com.boniluca.finance.application.port.in.GetCurrentDebt;
import com.boniluca.finance.application.port.out.DebtRepository;
import com.boniluca.finance.domain.model.Debt;

public class DebtService implements GetCurrentDebt {

    private final DebtRepository repository;

    public DebtService(DebtRepository repository) {
        this.repository = repository;
    }

    @Override
    public Debt currentDebt() {
        return repository.load();
    }
}
