package com.budgetapp.adapter.persistence.postgres.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;

@Entity
@Table(name = "skipped_occurrences", uniqueConstraints = @UniqueConstraint(columnNames = {"recurringExpenseId", "date"}))
public class SkippedOccurrenceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long recurringExpenseId;

    @Column(nullable = false)
    private LocalDate date;

    protected SkippedOccurrenceEntity() {
    }

    public SkippedOccurrenceEntity(Long id, Long recurringExpenseId, LocalDate date) {
        this.id = id;
        this.recurringExpenseId = recurringExpenseId;
        this.date = date;
    }

    public Long getId() { return id; }
    public Long getRecurringExpenseId() { return recurringExpenseId; }
    public LocalDate getDate() { return date; }
}
