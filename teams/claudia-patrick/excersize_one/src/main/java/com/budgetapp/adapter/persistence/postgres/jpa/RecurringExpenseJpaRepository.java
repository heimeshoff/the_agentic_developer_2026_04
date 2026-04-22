package com.budgetapp.adapter.persistence.postgres.jpa;

import com.budgetapp.adapter.persistence.postgres.model.RecurringExpenseEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecurringExpenseJpaRepository extends JpaRepository<RecurringExpenseEntity, Long> {

    List<RecurringExpenseEntity> findByActiveTrue();

    List<RecurringExpenseEntity> findAllByOrderByStartDateDesc();
}
