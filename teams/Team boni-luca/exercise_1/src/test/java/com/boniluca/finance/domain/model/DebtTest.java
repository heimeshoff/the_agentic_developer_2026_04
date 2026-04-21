package com.boniluca.finance.domain.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DebtTest {

    @Test
    void preservesBigDecimalScaleAsWritten() {
        Debt debt = new Debt(new BigDecimal("27376.35"));

        assertThat(debt.balance().toPlainString()).isEqualTo("27376.35");
    }

    @Test
    void debtsWithEqualBalanceAreEqual() {
        Debt a = new Debt(new BigDecimal("27376.35"));
        Debt b = new Debt(new BigDecimal("27376.35"));

        assertThat(a).isEqualTo(b);
    }

    @Test
    void rejectsNullBalance() {
        assertThatThrownBy(() -> new Debt(null))
                .isInstanceOf(NullPointerException.class);
    }
}
