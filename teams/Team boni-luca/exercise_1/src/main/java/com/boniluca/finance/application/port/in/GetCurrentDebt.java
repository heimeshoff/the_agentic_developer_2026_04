package com.boniluca.finance.application.port.in;

import com.boniluca.finance.domain.model.Debt;

public interface GetCurrentDebt {
    Debt currentDebt();
}
