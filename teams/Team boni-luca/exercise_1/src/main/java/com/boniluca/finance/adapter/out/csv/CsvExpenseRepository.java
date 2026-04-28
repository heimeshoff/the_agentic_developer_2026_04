package com.boniluca.finance.adapter.out.csv;

import com.boniluca.finance.application.port.out.ExpenseRepository;
import com.boniluca.finance.domain.model.Expense;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

@Component
public class CsvExpenseRepository implements ExpenseRepository {

    private static final String HEADER = "amount,category,date,description";

    private final Path csvPath;

    public CsvExpenseRepository(@Value("${finance.data.dir}") String dataDir) {
        this.csvPath = Paths.get(dataDir, "expenses.csv");
    }

    @Override
    public void append(Expense expense) {
        try {
            Path parent = csvPath.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }
            String row = expense.amount().toPlainString()
                    + "," + expense.category().name()
                    + "," + expense.date().toString()
                    + "," + escape(expense.description().orElse(""))
                    + System.lineSeparator();
            if (!Files.exists(csvPath)) {
                String content = HEADER + System.lineSeparator() + row;
                Files.writeString(csvPath, content, StandardCharsets.UTF_8);
            } else {
                Files.writeString(csvPath, row, StandardCharsets.UTF_8,
                        StandardOpenOption.APPEND);
            }
        } catch (IOException e) {
            throw new UncheckedIOException("failed to write " + csvPath, e);
        }
    }

    private static String escape(String value) {
        if (value.isEmpty()) {
            return "";
        }
        boolean needsQuoting = value.indexOf(',') >= 0
                || value.indexOf('"') >= 0
                || value.indexOf('\n') >= 0
                || value.indexOf('\r') >= 0;
        if (!needsQuoting) {
            return value;
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
