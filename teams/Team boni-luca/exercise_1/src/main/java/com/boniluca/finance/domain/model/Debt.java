package com.boniluca.finance.domain.model;

import java.math.BigDecimal;
import java.util.Objects;

public record Debt(BigDecimal balance) {
    public Debt {
        Objects.requireNonNull(balance, "balance");
    }

    public Debt increasedBy(BigDecimal amount) {
        Objects.requireNonNull(amount, "amount");
        if (amount.signum() <= 0) {
            throw new IllegalArgumentException("amount must be positive: " + amount.toPlainString());
        }
        return new Debt(balance.add(amount));
    }
}
