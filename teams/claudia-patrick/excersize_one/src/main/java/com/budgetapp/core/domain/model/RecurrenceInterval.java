package com.budgetapp.core.domain.model;

public enum RecurrenceInterval {
    WEEKLY("Weekly"),
    MONTHLY("Monthly"),
    YEARLY("Yearly");

    private final String displayName;

    RecurrenceInterval(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
