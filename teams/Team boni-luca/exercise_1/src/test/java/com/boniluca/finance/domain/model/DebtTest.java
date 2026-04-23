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

    @Test
    void increasedByGrowsBalance() {
        Debt before = new Debt(new BigDecimal("100.00"));

        Debt after = before.increasedBy(new BigDecimal("12.50"));

        assertThat(after.balance()).isEqualByComparingTo("112.50");
    }

    @Test
    void increasedByReturnsNewInstance() {
        Debt before = new Debt(new BigDecimal("100.00"));

        Debt after = before.increasedBy(new BigDecimal("1"));

        assertThat(after).isNotSameAs(before);
        assertThat(before.balance()).isEqualByComparingTo("100.00");
    }

    @Test
    void increasedByRejectsZero() {
        assertThatThrownBy(() -> new Debt(new BigDecimal("100")).increasedBy(BigDecimal.ZERO))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void increasedByRejectsNegative() {
        assertThatThrownBy(() -> new Debt(new BigDecimal("100")).increasedBy(new BigDecimal("-1")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void increasedByRejectsNull() {
        assertThatThrownBy(() -> new Debt(new BigDecimal("100")).increasedBy(null))
                .isInstanceOf(NullPointerException.class);
    }
}
