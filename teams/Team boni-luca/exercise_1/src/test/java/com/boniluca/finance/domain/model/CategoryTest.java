package com.boniluca.finance.domain.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CategoryTest {

    @Test
    void defaultsContainTheFourSeedCategoriesInOrder() {
        assertThat(Category.DEFAULTS)
                .extracting(Category::name)
                .containsExactly("food", "living expenses", "pokemon cards", "car expenses");
    }

    @Test
    void ofTrimsSurroundingWhitespace() {
        assertThat(Category.of("  groceries  ").name()).isEqualTo("groceries");
    }

    @Test
    void rejectsBlankName() {
        assertThatThrownBy(() -> new Category("   "))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsNullName() {
        assertThatThrownBy(() -> new Category(null))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    void categoriesWithSameNameAreEqual() {
        assertThat(new Category("food")).isEqualTo(Category.FOOD);
    }
}
