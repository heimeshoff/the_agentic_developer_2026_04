package com.boniluca.finance.adapter.out.csv;

import com.boniluca.finance.application.port.out.DebtRepository;
import com.boniluca.finance.domain.model.Debt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Component
public class CsvDebtRepository implements DebtRepository {

    private static final String HEADER = "balance";
    private static final BigDecimal OPENING_BALANCE = new BigDecimal("27376.35");

    private final Path csvPath;

    public CsvDebtRepository(@Value("${finance.data.dir}") String dataDir) {
        this.csvPath = Paths.get(dataDir, "debt.csv");
    }

    @Override
    public Debt load() {
        if (!Files.exists(csvPath)) {
            save(new Debt(OPENING_BALANCE));
        }
        try {
            List<String> lines = Files.readAllLines(csvPath, StandardCharsets.UTF_8);
            if (lines.size() < 2) {
                throw new IllegalStateException("debt.csv has no data row at " + csvPath);
            }
            return new Debt(new BigDecimal(lines.get(1).trim()));
        } catch (IOException e) {
            throw new UncheckedIOException("failed to read " + csvPath, e);
        }
    }

    @Override
    public void save(Debt debt) {
        try {
            Path parent = csvPath.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }
            String content = HEADER + System.lineSeparator()
                    + debt.balance().toPlainString() + System.lineSeparator();
            Files.writeString(csvPath, content, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("failed to write " + csvPath, e);
        }
    }
}
