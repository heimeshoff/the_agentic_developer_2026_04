package com.boniluca.finance.adapter.in.web;

import com.boniluca.finance.application.port.in.RecordExpense;
import com.boniluca.finance.domain.model.Category;
import com.boniluca.finance.domain.model.Expense;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;

@Controller
public class ExpenseController {

    private final RecordExpense recordExpense;

    public ExpenseController(RecordExpense recordExpense) {
        this.recordExpense = recordExpense;
    }

    @GetMapping("/expenses/new")
    public String newExpense(Model model) {
        model.addAttribute("categories", Category.DEFAULTS);
        model.addAttribute("today", LocalDate.now());
        model.addAttribute("form", new HashMap<String, String>());
        return "expense-form";
    }

    @PostMapping("/expenses")
    public String createExpense(
            @RequestParam(name = "amount", required = false) String amount,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(name = "description", required = false) String description,
            Model model) {

        Map<String, String> form = new HashMap<>();
        form.put("amount", amount);
        form.put("category", category);
        form.put("date", date != null ? date.toString() : null);
        form.put("description", description);

        try {
            if (amount == null || amount.isBlank()) {
                throw new IllegalArgumentException("amount is required");
            }
            if (category == null || category.isBlank()) {
                throw new IllegalArgumentException("category is required");
            }
            if (date == null) {
                throw new IllegalArgumentException("date is required");
            }
            BigDecimal parsedAmount = new BigDecimal(amount.trim());
            Category parsedCategory = Category.of(category);
            Expense expense = Expense.of(parsedAmount, parsedCategory, date, description);
            recordExpense.record(expense);
            return "redirect:/";
        } catch (IllegalArgumentException | NullPointerException | DateTimeParseException ex) {
            model.addAttribute("categories", Category.DEFAULTS);
            model.addAttribute("today", LocalDate.now());
            model.addAttribute("form", form);
            model.addAttribute("error", ex.getMessage() != null ? ex.getMessage() : "Invalid input");
            return "expense-form";
        }
    }
}
