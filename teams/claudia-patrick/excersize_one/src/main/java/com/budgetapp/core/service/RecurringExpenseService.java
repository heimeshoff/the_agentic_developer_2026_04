package com.budgetapp.core.service;

import com.budgetapp.core.domain.model.Expense;
import com.budgetapp.core.domain.model.ExpenseCategory;
import com.budgetapp.core.domain.model.RecurrenceInterval;
import com.budgetapp.core.domain.model.RecurringExpense;
import com.budgetapp.core.domain.model.SkippedOccurrence;
import com.budgetapp.core.port.ExpenseRepository;
import com.budgetapp.core.port.RecurringExpenseRepository;
import com.budgetapp.core.port.SkippedOccurrenceRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RecurringExpenseService {

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final ExpenseRepository expenseRepository;
    private final SkippedOccurrenceRepository skippedOccurrenceRepository;

    public RecurringExpenseService(RecurringExpenseRepository recurringExpenseRepository,
                                   ExpenseRepository expenseRepository,
                                   SkippedOccurrenceRepository skippedOccurrenceRepository) {
        this.recurringExpenseRepository = recurringExpenseRepository;
        this.expenseRepository = expenseRepository;
        this.skippedOccurrenceRepository = skippedOccurrenceRepository;
    }

    public static List<LocalDate> calculateOccurrenceDates(RecurringExpense recurring,
                                                            LocalDate rangeStart, LocalDate rangeEnd) {
        if (!recurring.active()) {
            return List.of();
        }

        List<LocalDate> dates = new ArrayList<>();
        LocalDate startDate = recurring.startDate();
        LocalDate effectiveEnd = recurring.endDate() != null && recurring.endDate().isBefore(rangeEnd)
                ? recurring.endDate()
                : rangeEnd;

        int dayOfMonth = startDate.getDayOfMonth();
        long index = 0;

        while (true) {
            LocalDate candidate = advanceDate(startDate, recurring.interval(), index, dayOfMonth);
            if (candidate.isAfter(effectiveEnd)) {
                break;
            }
            if (!candidate.isBefore(rangeStart)) {
                dates.add(candidate);
            }
            index++;
        }

        return dates;
    }

    private static LocalDate advanceDate(LocalDate startDate, RecurrenceInterval interval,
                                          long steps, int originalDayOfMonth) {
        return switch (interval) {
            case WEEKLY -> startDate.plusWeeks(steps);
            case MONTHLY -> {
                LocalDate advanced = startDate.plusMonths(steps);
                int maxDay = advanced.lengthOfMonth();
                yield advanced.withDayOfMonth(Math.min(originalDayOfMonth, maxDay));
            }
            case YEARLY -> {
                LocalDate advanced = startDate.plusYears(steps);
                int maxDay = advanced.lengthOfMonth();
                yield advanced.withDayOfMonth(Math.min(originalDayOfMonth, maxDay));
            }
        };
    }

    public int generateExpenses(LocalDate rangeStart, LocalDate rangeEnd) {
        List<RecurringExpense> activeRecurring = recurringExpenseRepository.findByActiveTrue();
        int generated = 0;

        for (RecurringExpense recurring : activeRecurring) {
            List<LocalDate> dates = calculateOccurrenceDates(recurring, rangeStart, rangeEnd);

            for (LocalDate date : dates) {
                if (expenseRepository.existsByRecurringExpenseIdAndDate(recurring.id(), date)) {
                    continue;
                }
                if (skippedOccurrenceRepository.existsByRecurringExpenseIdAndDate(recurring.id(), date)) {
                    continue;
                }

                Expense expense = new Expense(
                        recurring.description(),
                        recurring.amount(),
                        date,
                        recurring.category()
                );
                expenseRepository.save(expense.withRecurringExpenseId(recurring.id()));
                generated++;
            }
        }

        return generated;
    }

    public void skipOccurrence(Long recurringExpenseId, LocalDate date) {
        if (!skippedOccurrenceRepository.existsByRecurringExpenseIdAndDate(recurringExpenseId, date)) {
            skippedOccurrenceRepository.save(new SkippedOccurrence(recurringExpenseId, date));
        }
        expenseRepository.findByRecurringExpenseId(recurringExpenseId).stream()
                .filter(e -> e.date().equals(date))
                .forEach(e -> expenseRepository.deleteById(e.id()));
    }

    public List<RecurringExpense> findAll() {
        return recurringExpenseRepository.findAllOrderByStartDateDesc();
    }

    public RecurringExpense addRecurringExpense(String description, BigDecimal amount,
                                                 ExpenseCategory category, RecurrenceInterval interval,
                                                 LocalDate startDate, LocalDate endDate) {
        return recurringExpenseRepository.save(
                new RecurringExpense(description, amount, category, interval, startDate, endDate));
    }

    public void deactivate(Long id) {
        recurringExpenseRepository.findById(id).ifPresent(r ->
                recurringExpenseRepository.save(r.deactivate()));
    }

    public void delete(Long id) {
        recurringExpenseRepository.deleteById(id);
    }
}
