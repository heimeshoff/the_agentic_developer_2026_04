package com.boniluca.finance.domain.model;

import java.math.BigDecimal;
import java.util.Objects;

public record Debt(BigDecimal balance) {
    public Debt {
        Objects.requireNonNull(balance, "balance");
    }
}
