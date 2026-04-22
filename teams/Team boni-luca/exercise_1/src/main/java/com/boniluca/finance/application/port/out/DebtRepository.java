package com.boniluca.finance.application.port.out;

import com.boniluca.finance.domain.model.Debt;

public interface DebtRepository {
    Debt load();

    void save(Debt debt);
}
