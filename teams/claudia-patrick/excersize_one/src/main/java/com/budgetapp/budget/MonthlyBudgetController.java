package com.budgetapp.budget;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/budget")
public class MonthlyBudgetController {

    private final MonthlyBudgetRepository repository;

    public MonthlyBudgetController(MonthlyBudgetRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public String budgetPage(Model model) {
        LocalDate now = LocalDate.now();
        Optional<MonthlyBudget> currentBudget = repository.findByYearAndMonth(now.getYear(), now.getMonthValue());

        model.addAttribute("currentBudget", currentBudget.orElse(null));
        model.addAttribute("currentMonth", now.getMonth().name().charAt(0)
                + now.getMonth().name().substring(1).toLowerCase());
        model.addAttribute("currentYear", now.getYear());
        model.addAttribute("budgets", repository.findAllByOrderByYearDescMonthDesc());

        BudgetForm form = new BudgetForm();
        form.setYear(now.getYear());
        form.setMonth(now.getMonthValue());
        if (currentBudget.isPresent()) {
            form.setAmount(currentBudget.get().getAmount());
        }
        model.addAttribute("budgetForm", form);

        return "budget";
    }

    @PostMapping
    public String saveBudget(@Valid BudgetForm budgetForm, BindingResult bindingResult,
                             Model model, RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            LocalDate now = LocalDate.now();
            Optional<MonthlyBudget> currentBudget = repository.findByYearAndMonth(now.getYear(), now.getMonthValue());
            model.addAttribute("currentBudget", currentBudget.orElse(null));
            model.addAttribute("currentMonth", now.getMonth().name().charAt(0)
                    + now.getMonth().name().substring(1).toLowerCase());
            model.addAttribute("currentYear", now.getYear());
            model.addAttribute("budgets", repository.findAllByOrderByYearDescMonthDesc());
            return "budget";
        }

        Optional<MonthlyBudget> existing = repository.findByYearAndMonth(budgetForm.getYear(), budgetForm.getMonth());
        if (existing.isPresent()) {
            existing.get().setAmount(budgetForm.getAmount());
            repository.save(existing.get());
        } else {
            repository.save(new MonthlyBudget(budgetForm.getYear(), budgetForm.getMonth(), budgetForm.getAmount()));
        }

        redirectAttributes.addFlashAttribute("success", "Budget saved successfully!");
        return "redirect:/budget";
    }

    public static class BudgetForm {

        @NotNull(message = "Year is required")
        @Min(value = 2000, message = "Year must be 2000 or later")
        @Max(value = 2100, message = "Year must be before 2100")
        private Integer year;

        @NotNull(message = "Month is required")
        @Min(value = 1, message = "Month must be between 1 and 12")
        @Max(value = 12, message = "Month must be between 1 and 12")
        private Integer month;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.00", message = "Amount must be zero or positive")
        private BigDecimal amount;

        public Integer getYear() {
            return year;
        }

        public void setYear(Integer year) {
            this.year = year;
        }

        public Integer getMonth() {
            return month;
        }

        public void setMonth(Integer month) {
            this.month = month;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }
    }
}
