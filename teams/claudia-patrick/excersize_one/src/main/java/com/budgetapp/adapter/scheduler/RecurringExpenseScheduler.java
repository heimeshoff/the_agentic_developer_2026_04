package com.budgetapp.adapter.scheduler;

import com.budgetapp.core.service.RecurringExpenseService;
import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RecurringExpenseScheduler {

    private static final Logger log = LoggerFactory.getLogger(RecurringExpenseScheduler.class);

    private final RecurringExpenseService service;

    public RecurringExpenseScheduler(RecurringExpenseService service) {
        this.service = service;
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void generateDailyExpenses() {
        LocalDate today = LocalDate.now();
        int count = service.generateExpenses(today, today);
        if (count > 0) {
            log.info("Generated {} recurring expense(s) for {}", count, today);
        }
    }
}
