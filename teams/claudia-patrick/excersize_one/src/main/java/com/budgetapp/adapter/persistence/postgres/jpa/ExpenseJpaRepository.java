package com.budgetapp.adapter.persistence.postgres.jpa;

import com.budgetapp.adapter.persistence.postgres.model.ExpenseEntity;
import com.budgetapp.core.domain.model.ExpenseCategory;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExpenseJpaRepository extends JpaRepository<ExpenseEntity, Long> {

    List<ExpenseEntity> findByDateBetweenOrderByDateDescIdDesc(LocalDate start, LocalDate end);

    @Query("SELECT e.category, SUM(e.amount) FROM ExpenseEntity e WHERE e.date BETWEEN :start AND :end GROUP BY e.category ORDER BY SUM(e.amount) DESC")
    List<Object[]> sumByCategory(LocalDate start, LocalDate end);

    boolean existsByRecurringExpenseIdAndDate(Long recurringExpenseId, LocalDate date);

    List<ExpenseEntity> findByRecurringExpenseId(Long recurringExpenseId);
}
