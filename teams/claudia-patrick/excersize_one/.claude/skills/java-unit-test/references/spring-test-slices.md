# Spring Test Slices

## When to use which annotation

| Layer        | Annotation                        | What it loads              | Mock with         |
|-------------|-----------------------------------|---------------------------|-------------------|
| Service     | None (plain JUnit + Mockito)      | Nothing                   | `@Mock`           |
| Controller  | `@WebMvcTest(Controller.class)`   | Web layer only            | `@MockBean`       |
| Repository  | `@DataJpaTest`                    | JPA + embedded DB         | (real DB)         |
| Full app    | `@SpringBootTest`                 | Everything                | `@MockBean`       |

## Service tests (no Spring context)

Most service tests need no Spring context at all. Use plain Mockito:

```java
@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    ExpenseRepository expenseRepository;

    @InjectMocks
    ExpenseService expenseService;

    @Test
    @DisplayName("addExpense saves expense to repository")
    void addExpense_savesExpenseToRepository() {
        // given
        var expense = anExpense().build();
        when(expenseRepository.save(expense)).thenReturn(expense);

        // when
        var result = expenseService.addExpense(expense);

        // then
        assertThat(result).isEqualTo(expense);
        verify(expenseRepository).save(expense);
    }
}
```

## Controller tests (WebMvcTest)

Use `@WebMvcTest` to test the web layer in isolation:

```java
@WebMvcTest(ExpenseController.class)
class ExpenseControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    ExpenseService expenseService;

    @Test
    @DisplayName("GET /expenses returns 200 with expense list")
    void getExpenses_returns200WithExpenseList() throws Exception {
        // given
        when(expenseService.findAll()).thenReturn(List.of(anExpense().build()));

        // when / then
        mockMvc.perform(get("/expenses"))
                .andExpect(status().isOk())
                .andExpect(model().attributeExists("expenses"));
    }
}
```

## Repository tests (DataJpaTest)

Use `@DataJpaTest` for repository tests with an embedded database:

```java
@DataJpaTest
class ExpenseRepositoryTest {

    @Autowired
    ExpenseRepository expenseRepository;

    @Test
    @DisplayName("findByCategory returns only expenses in given category")
    void findByCategory_returnsOnlyExpensesInGivenCategory() {
        // given
        expenseRepository.save(anExpense().withCategory(Category.FOOD).build());
        expenseRepository.save(anExpense().withCategory(Category.TRANSPORT).build());

        // when
        var results = expenseRepository.findByCategory(Category.FOOD);

        // then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getCategory()).isEqualTo(Category.FOOD);
    }
}
```

## Key rules

* Default to the narrowest slice that covers the layer under test.
* Never use `@SpringBootTest` for a unit test — it loads the full application context.
* `@MockBean` replaces a bean in the Spring context; `@Mock` works without Spring.
* Use `@Mock` in service tests, `@MockBean` in slice tests (`@WebMvcTest`, `@DataJpaTest`).
