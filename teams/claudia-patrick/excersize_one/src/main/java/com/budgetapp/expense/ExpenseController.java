package com.budgetapp.expense;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/expenses")
public class ExpenseController {

    private final ExpenseRepository repository;

    public ExpenseController(ExpenseRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public String expensesPage(Model model) {
        YearMonth currentMonth = YearMonth.now();
        LocalDate start = currentMonth.atDay(1);
        LocalDate end = currentMonth.atEndOfMonth();

        List<Expense> monthlyExpenses = repository.findByDateBetweenOrderByDateDescIdDesc(start, end);
        BigDecimal totalSpent = monthlyExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> categoryTotals = buildCategoryTotals(start, end);
        Map<String, Integer> categoryPercents = buildCategoryPercents(categoryTotals, totalSpent);

        model.addAttribute("expenses", monthlyExpenses);
        model.addAttribute("totalSpent", totalSpent);
        model.addAttribute("currentMonth", currentMonth.getMonth().name().charAt(0)
                + currentMonth.getMonth().name().substring(1).toLowerCase());
        model.addAttribute("currentYear", currentMonth.getYear());
        model.addAttribute("categoryTotals", categoryTotals);
        model.addAttribute("categoryPercents", categoryPercents);
        model.addAttribute("categories", ExpenseCategory.values());

        ExpenseForm form = new ExpenseForm();
        form.setDate(LocalDate.now());
        model.addAttribute("expenseForm", form);

        return "expenses";
    }

    @PostMapping
    public String addExpense(@Valid ExpenseForm expenseForm, BindingResult bindingResult,
                             Model model, RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            YearMonth currentMonth = YearMonth.now();
            LocalDate start = currentMonth.atDay(1);
            LocalDate end = currentMonth.atEndOfMonth();

            List<Expense> monthlyExpenses = repository.findByDateBetweenOrderByDateDescIdDesc(start, end);
            BigDecimal totalSpent = monthlyExpenses.stream()
                    .map(Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            model.addAttribute("expenses", monthlyExpenses);
            model.addAttribute("totalSpent", totalSpent);
            model.addAttribute("currentMonth", currentMonth.getMonth().name().charAt(0)
                    + currentMonth.getMonth().name().substring(1).toLowerCase());
            model.addAttribute("currentYear", currentMonth.getYear());
            Map<String, BigDecimal> catTotals = buildCategoryTotals(start, end);
            model.addAttribute("categoryTotals", catTotals);
            model.addAttribute("categoryPercents", buildCategoryPercents(catTotals, totalSpent));
            model.addAttribute("categories", ExpenseCategory.values());
            return "expenses";
        }

        Expense expense = new Expense(
                expenseForm.getDescription(),
                expenseForm.getAmount(),
                expenseForm.getDate(),
                expenseForm.getCategory()
        );
        repository.save(expense);

        redirectAttributes.addFlashAttribute("success", "Expense added!");
        return "redirect:/expenses";
    }

    @PostMapping("/{id}/delete")
    public String deleteExpense(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        repository.deleteById(id);
        redirectAttributes.addFlashAttribute("success", "Expense deleted.");
        return "redirect:/expenses";
    }

    private Map<String, Integer> buildCategoryPercents(Map<String, BigDecimal> totals, BigDecimal totalSpent) {
        Map<String, Integer> percents = new LinkedHashMap<>();
        if (totalSpent.compareTo(BigDecimal.ZERO) > 0) {
            for (Map.Entry<String, BigDecimal> entry : totals.entrySet()) {
                int pct = entry.getValue().multiply(BigDecimal.valueOf(100L))
                        .divide(totalSpent, 0, RoundingMode.HALF_UP).intValue();
                percents.put(entry.getKey(), pct);
            }
        }
        return percents;
    }

    private Map<String, BigDecimal> buildCategoryTotals(LocalDate start, LocalDate end) {
        Map<String, BigDecimal> totals = new LinkedHashMap<>();
        for (Object[] row : repository.sumByCategory(start, end)) {
            ExpenseCategory cat = (ExpenseCategory) row[0];
            BigDecimal sum = (BigDecimal) row[1];
            totals.put(cat.getDisplayName(), sum);
        }
        return totals;
    }

    public static class ExpenseForm {

        @NotBlank(message = "Description is required")
        @Size(max = 255, message = "Description must be under 255 characters")
        private String description;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be positive")
        private BigDecimal amount;

        @NotNull(message = "Date is required")
        private LocalDate date;

        @NotNull(message = "Category is required")
        private ExpenseCategory category;

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }

        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }

        public ExpenseCategory getCategory() {
            return category;
        }

        public void setCategory(ExpenseCategory category) {
            this.category = category;
        }
    }
}
