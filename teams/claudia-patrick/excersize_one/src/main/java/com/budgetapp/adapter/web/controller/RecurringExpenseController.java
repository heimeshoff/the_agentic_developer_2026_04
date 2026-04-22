package com.budgetapp.adapter.web.controller;

import com.budgetapp.core.domain.model.ExpenseCategory;
import com.budgetapp.core.domain.model.RecurrenceInterval;
import com.budgetapp.core.service.RecurringExpenseService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/recurring")
public class RecurringExpenseController {

    private final RecurringExpenseService recurringExpenseService;

    public RecurringExpenseController(RecurringExpenseService recurringExpenseService) {
        this.recurringExpenseService = recurringExpenseService;
    }

    @GetMapping
    public String listPage(Model model) {
        model.addAttribute("recurringExpenses", recurringExpenseService.findAll());
        model.addAttribute("categories", ExpenseCategory.values());
        model.addAttribute("intervals", RecurrenceInterval.values());

        RecurringExpenseForm form = new RecurringExpenseForm();
        form.setStartDate(LocalDate.now());
        model.addAttribute("recurringForm", form);

        return "recurring";
    }

    @PostMapping
    public String addRecurring(@Valid RecurringExpenseForm recurringForm, BindingResult bindingResult,
                                Model model, RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("recurringExpenses", recurringExpenseService.findAll());
            model.addAttribute("categories", ExpenseCategory.values());
            model.addAttribute("intervals", RecurrenceInterval.values());
            return "recurring";
        }

        recurringExpenseService.addRecurringExpense(
                recurringForm.getDescription(),
                recurringForm.getAmount(),
                recurringForm.getCategory(),
                recurringForm.getInterval(),
                recurringForm.getStartDate(),
                recurringForm.getEndDate()
        );

        redirectAttributes.addFlashAttribute("success", "Recurring expense added!");
        return "redirect:/recurring";
    }

    @PostMapping("/{id}/deactivate")
    public String deactivate(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        recurringExpenseService.deactivate(id);
        redirectAttributes.addFlashAttribute("success", "Recurring expense deactivated.");
        return "redirect:/recurring";
    }

    @PostMapping("/{id}/delete")
    public String delete(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        recurringExpenseService.delete(id);
        redirectAttributes.addFlashAttribute("success", "Recurring expense deleted.");
        return "redirect:/recurring";
    }

    @PostMapping("/generate")
    public String generateNow(RedirectAttributes redirectAttributes) {
        LocalDate today = LocalDate.now();
        int count = recurringExpenseService.generateExpenses(today, today);
        redirectAttributes.addFlashAttribute("success",
                count > 0 ? count + " expense(s) generated!" : "No new expenses to generate.");
        return "redirect:/recurring";
    }

    public static class RecurringExpenseForm {

        @NotBlank(message = "Description is required")
        @Size(max = 255, message = "Description must be under 255 characters")
        private String description;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be positive")
        private BigDecimal amount;

        @NotNull(message = "Category is required")
        private ExpenseCategory category;

        @NotNull(message = "Interval is required")
        private RecurrenceInterval interval;

        @NotNull(message = "Start date is required")
        private LocalDate startDate;

        private LocalDate endDate;

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public ExpenseCategory getCategory() { return category; }
        public void setCategory(ExpenseCategory category) { this.category = category; }
        public RecurrenceInterval getInterval() { return interval; }
        public void setInterval(RecurrenceInterval interval) { this.interval = interval; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    }
}
