package com.budgetapp.expense;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findAllByOrderByDateDescIdDesc();

    List<Expense> findByDateBetweenOrderByDateDescIdDesc(LocalDate start, LocalDate end);

    @Query("SELECT e.category, SUM(e.amount) FROM Expense e WHERE e.date BETWEEN :start AND :end GROUP BY e.category ORDER BY SUM(e.amount) DESC")
    List<Object[]> sumByCategory(LocalDate start, LocalDate end);
}
