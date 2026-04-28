package com.boniluca.finance.adapter.out.csv;

import com.boniluca.finance.domain.model.Category;
import com.boniluca.finance.domain.model.Expense;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CsvExpenseRepositoryTest {

    @TempDir
    Path tempDir;

    @Test
    void first_append_creates_file_with_header_and_one_row() throws IOException {
        CsvExpenseRepository repo = new CsvExpenseRepository(tempDir.toString());

        repo.append(Expense.of(
                new BigDecimal("12.34"),
                Category.FOOD,
                LocalDate.of(2026, 4, 23),
                "lunch"));

        Path csv = tempDir.resolve("expenses.csv");
        assertThat(csv).exists();
        List<String> lines = Files.readAllLines(csv, StandardCharsets.UTF_8);
        assertThat(lines).containsExactly(
                "amount,category,date,description",
                "12.34,food,2026-04-23,lunch");
    }

    @Test
    void second_append_keeps_one_header_and_appends_second_row() throws IOException {
        CsvExpenseRepository repo = new CsvExpenseRepository(tempDir.toString());

        repo.append(Expense.of(
                new BigDecimal("10.00"),
                Category.FOOD,
                LocalDate.of(2026, 4, 23),
                "first"));
        repo.append(Expense.of(
                new BigDecimal("20.00"),
                Category.POKEMON_CARDS,
                LocalDate.of(2026, 4, 24),
                "second"));

        Path csv = tempDir.resolve("expenses.csv");
        List<String> lines = Files.readAllLines(csv, StandardCharsets.UTF_8);
        assertThat(lines).containsExactly(
                "amount,category,date,description",
                "10.00,food,2026-04-23,first",
                "20.00,pokemon cards,2026-04-24,second");
    }

    @Test
    void description_with_comma_and_quote_is_escaped() throws IOException {
        CsvExpenseRepository repo = new CsvExpenseRepository(tempDir.toString());

        repo.append(Expense.of(
                new BigDecimal("5.00"),
                Category.FOOD,
                LocalDate.of(2026, 4, 23),
                "He said \"hi\", right?"));

        Path csv = tempDir.resolve("expenses.csv");
        List<String> lines = Files.readAllLines(csv, StandardCharsets.UTF_8);
        assertThat(lines).containsExactly(
                "amount,category,date,description",
                "5.00,food,2026-04-23,\"He said \"\"hi\"\", right?\"");
    }

    @Test
    void empty_description_writes_trailing_empty_field() throws IOException {
        CsvExpenseRepository repo = new CsvExpenseRepository(tempDir.toString());

        repo.append(Expense.of(
                new BigDecimal("9.99"),
                Category.FOOD,
                LocalDate.of(2026, 4, 23),
                null));

        Path csv = tempDir.resolve("expenses.csv");
        List<String> lines = Files.readAllLines(csv, StandardCharsets.UTF_8);
        assertThat(lines).hasSize(2);
        assertThat(lines.get(1)).isEqualTo("9.99,food,2026-04-23,");
        assertThat(lines.get(1)).endsWith(",");
    }

    @Test
    void amount_uses_dot_decimal_without_thousands_separator() throws IOException {
        CsvExpenseRepository repo = new CsvExpenseRepository(tempDir.toString());

        repo.append(Expense.of(
                new BigDecimal("1234.50"),
                Category.LIVING_EXPENSES,
                LocalDate.of(2026, 4, 23),
                "rent"));

        Path csv = tempDir.resolve("expenses.csv");
        List<String> lines = Files.readAllLines(csv, StandardCharsets.UTF_8);
        assertThat(lines.get(1)).startsWith("1234.50,");
        assertThat(lines.get(1)).doesNotContain(",1,234");
    }
}
