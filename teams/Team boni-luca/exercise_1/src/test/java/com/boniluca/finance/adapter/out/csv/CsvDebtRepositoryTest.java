package com.boniluca.finance.adapter.out.csv;

import com.boniluca.finance.domain.model.Debt;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class CsvDebtRepositoryTest {

    @Test
    void seedsOpeningBalanceWhenFileMissing(@TempDir Path tempDir) {
        CsvDebtRepository repo = new CsvDebtRepository(tempDir.toString());

        Debt loaded = repo.load();

        assertThat(loaded.balance()).isEqualByComparingTo(new BigDecimal("27376.35"));
        assertThat(Files.exists(tempDir.resolve("debt.csv"))).isTrue();
    }

    @Test
    void roundTripsArbitraryBalance(@TempDir Path tempDir) {
        CsvDebtRepository repo = new CsvDebtRepository(tempDir.toString());
        Debt original = new Debt(new BigDecimal("12345.67"));

        repo.save(original);
        Debt loaded = repo.load();

        assertThat(loaded).isEqualTo(original);
    }

    @Test
    void writesHeaderRowFirst(@TempDir Path tempDir) throws Exception {
        CsvDebtRepository repo = new CsvDebtRepository(tempDir.toString());

        repo.save(new Debt(new BigDecimal("100.00")));
        String content = Files.readString(tempDir.resolve("debt.csv"));

        assertThat(content).startsWith("balance");
    }
}
