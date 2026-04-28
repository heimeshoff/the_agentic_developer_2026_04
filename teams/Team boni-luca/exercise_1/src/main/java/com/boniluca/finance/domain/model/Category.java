package com.boniluca.finance.domain.model;

import java.util.List;
import java.util.Objects;

public record Category(String name) {
    public Category {
        Objects.requireNonNull(name, "name");
        if (name.isBlank()) {
            throw new IllegalArgumentException("category name must not be blank");
        }
    }

    public static Category of(String name) {
        Objects.requireNonNull(name, "name");
        return new Category(name.trim());
    }

    public static final Category FOOD = new Category("food");
    public static final Category LIVING_EXPENSES = new Category("living expenses");
    public static final Category POKEMON_CARDS = new Category("pokemon cards");
    public static final Category CAR_EXPENSES = new Category("car expenses");

    public static final List<Category> DEFAULTS = List.of(FOOD, LIVING_EXPENSES, POKEMON_CARDS, CAR_EXPENSES);
}
