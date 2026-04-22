# Package Structure Reference (Generic Java Hexagonal)

## 1) Generic package structure

Use this package shape:

```text
com.example.todo
├── application
│   └── configuration
├── core
│   ├── domain
│   │   └── model
│   ├── port
│   └── service
└── adapter
    ├── rest
    │   ├── controller
    │   └── model
    ├── event
    │   └── kafka
    │       ├── consumer
    │       └── model
    ├── web
    │   └── client
    └── persistence
        └── postgres
            ├── jpa
            └── model
```

## 2) Class types and responsibilities

### Domain models (`core/domain/model`)

- Keep business data and invariant logic.
- Keep free of Spring, Kafka, HTTP, and JPA annotations.
- Prefer Java records for immutable data carriers.
- Do not use library-specific classes in `core` except these annotations:
  - `org.springframework.stereotype.Service`
  - `org.springframework.stereotype.Component`
  - `jakarta.transaction.Transactional`

### Ports (`core/port`)

- Define interfaces for external dependencies (database, web services, message producers).
- Keep as interfaces only.

### Use case services (`core/service`)

- Contain application workflows.
- Depend on domain models and port interfaces.
- Expose plain public methods. Do not create inbound port interfaces.
- Receive runtime options as method parameters instead of reading `@ConfigurationProperties` directly.

### REST and messaging adapters (`adapter/rest/...`, `adapter/event/...`)

- REST controllers and Kafka listeners map incoming payloads into domain/use-case calls.
- Call `core/service` classes directly.

### Technology adapters (`adapter/web/...`, `adapter/persistence/...`)

- Implement ports using HTTP clients, JPA repositories, etc.

### Adapter models

- Keep transport/storage models in adapter packages (DTOs, Kafka payloads, entities).
- Map them to and from domain models at adapter boundaries.
- Keep mapper methods in dedicated Java classes inside adapter packages.
- Enforce directional mapper classes:
  - `EntityToModelMapper.java`: only `toModel` methods.
  - `ModelToEntityMapper.java`: only `toEntity` methods.
  - `DtoToModelMapper.java`: only `toModel` methods.
  - `ModelToDtoMapper.java`: only `toDto` methods.
- Mapper classes are `final` with a `private` constructor; all methods are `static`.

## 3) Sample application: Todo create + Todo checked via Kafka + DB save

### 3.0 Application configuration

File: `application/configuration/JacksonConfig.java`

```java
package com.example.todo.application.configuration;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return JsonMapper.builder()
                .addModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .defaultSetterInfo(JsonSetter.Value.forValueNulls(Nulls.SKIP))
                .build();
    }
}
```

File: `application/configuration/TodoProperties.java`

```java
package com.example.todo.application.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "todo")
public record TodoProperties(int maximumNumberOfUncheckedTodos) {
}
```

File: `application/configuration/TodoPropertiesToOptionsMapper.java`

```java
package com.example.todo.application.configuration;

import com.example.todo.core.domain.model.TodoCreationOptions;

public final class TodoPropertiesToOptionsMapper {

    private TodoPropertiesToOptionsMapper() {
    }

    public static TodoCreationOptions toOptions(TodoProperties properties) {
        return new TodoCreationOptions(properties.maximumNumberOfUncheckedTodos());
    }
}
```

### 3.1 Domain model

```java
package com.example.todo.core.domain.model;

import java.util.UUID;

public record TodoItem(UUID id, UUID listId, String title, boolean checked) {

    public TodoItem check() {
        return new TodoItem(id, listId, title, true);
    }
}
```

```java
package com.example.todo.core.domain.model;

import java.util.UUID;

public record NewTodoItem(UUID listId, String title) {
}
```

```java
package com.example.todo.core.domain.model;

public record TodoCreationOptions(int maximumNumberOfUncheckedTodos) {
}
```

### 3.2 Ports

```java
package com.example.todo.core.port;

import com.example.todo.core.domain.model.TodoItem;

import java.util.Optional;
import java.util.UUID;

public interface TodoItemRepository {
    TodoItem save(TodoItem item);
    Optional<TodoItem> findById(UUID id);
    long countUncheckedByListId(UUID listId);
}
```

```java
package com.example.todo.core.port;

import java.util.UUID;

public interface TodoAuditClient {
    void notifyCreated(UUID todoId, String title);
}
```

### 3.3 Use case service (no inbound port interface)

```java
package com.example.todo.core.service;

import com.example.todo.core.domain.model.NewTodoItem;
import com.example.todo.core.domain.model.TodoCreationOptions;
import com.example.todo.core.domain.model.TodoItem;
import com.example.todo.core.port.TodoAuditClient;
import com.example.todo.core.port.TodoItemRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class TodoService {

    private final TodoItemRepository todoItemRepository;
    private final TodoAuditClient todoAuditClient;

    public TodoService(TodoItemRepository todoItemRepository, TodoAuditClient todoAuditClient) {
        this.todoItemRepository = todoItemRepository;
        this.todoAuditClient = todoAuditClient;
    }

    public TodoItem createTodo(NewTodoItem newTodoItem, TodoCreationOptions options) {
        long uncheckedCount = todoItemRepository.countUncheckedByListId(newTodoItem.listId());
        if (uncheckedCount >= options.maximumNumberOfUncheckedTodos()) {
            throw new IllegalStateException("Maximum number of unchecked todos reached");
        }

        var item = new TodoItem(
                UUID.randomUUID(),
                newTodoItem.listId(),
                newTodoItem.title(),
                false
        );
        TodoItem saved = todoItemRepository.save(item);
        todoAuditClient.notifyCreated(saved.id(), saved.title());
        return saved;
    }

    public Optional<TodoItem> checkTodo(UUID todoId) {
        return todoItemRepository.findById(todoId)
                .map(TodoItem::check)
                .map(todoItemRepository::save);
    }
}
```

### 3.4 Incoming REST adapter: create Todo item

```java
package com.example.todo.adapter.rest.controller;

import com.example.todo.application.configuration.TodoProperties;
import com.example.todo.application.configuration.TodoPropertiesToOptionsMapper;
import com.example.todo.core.domain.model.TodoItem;
import com.example.todo.core.service.TodoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TodoController {

    private final TodoService todoService;
    private final TodoProperties todoProperties;

    public TodoController(TodoService todoService, TodoProperties todoProperties) {
        this.todoService = todoService;
        this.todoProperties = todoProperties;
    }

    @PostMapping("/todo-items")
    public ResponseEntity<CreateTodoResponse> create(@RequestBody CreateTodoRequest request) {
        TodoItem item = todoService.createTodo(
                DtoToModelMapper.toModel(request),
                TodoPropertiesToOptionsMapper.toOptions(todoProperties)
        );
        return ResponseEntity.ok(ModelToDtoMapper.toDto(item));
    }
}
```

File: `adapter/rest/controller/CreateTodoRequest.java`

```java
package com.example.todo.adapter.rest.controller;

import java.util.UUID;

public record CreateTodoRequest(UUID listId, String title) {
}
```

File: `adapter/rest/controller/CreateTodoResponse.java`

```java
package com.example.todo.adapter.rest.controller;

import java.util.UUID;

public record CreateTodoResponse(UUID id, boolean checked) {
}
```

File: `adapter/rest/controller/DtoToModelMapper.java`

```java
package com.example.todo.adapter.rest.controller;

import com.example.todo.core.domain.model.NewTodoItem;

public final class DtoToModelMapper {

    private DtoToModelMapper() {
    }

    public static NewTodoItem toModel(CreateTodoRequest request) {
        return new NewTodoItem(request.listId(), request.title());
    }
}
```

File: `adapter/rest/controller/ModelToDtoMapper.java`

```java
package com.example.todo.adapter.rest.controller;

import com.example.todo.core.domain.model.TodoItem;

public final class ModelToDtoMapper {

    private ModelToDtoMapper() {
    }

    public static CreateTodoResponse toDto(TodoItem model) {
        return new CreateTodoResponse(model.id(), model.checked());
    }
}
```

### 3.5 Incoming Kafka adapter: Todo item checked event

```java
package com.example.todo.adapter.event.kafka.consumer;

import com.example.todo.core.service.TodoService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class TodoCheckedKafkaListener {

    private final TodoService todoService;

    public TodoCheckedKafkaListener(TodoService todoService) {
        this.todoService = todoService;
    }

    @KafkaListener(topics = "todo-item-checked")
    public void onMessage(TodoItemCheckedEvent event) {
        todoService.checkTodo(DtoToModelMapper.toModel(event));
    }
}
```

File: `adapter/event/kafka/consumer/TodoItemCheckedEvent.java`

```java
package com.example.todo.adapter.event.kafka.consumer;

public record TodoItemCheckedEvent(String todoId) {
}
```

File: `adapter/event/kafka/consumer/DtoToModelMapper.java`

```java
package com.example.todo.adapter.event.kafka.consumer;

import java.util.UUID;

public final class DtoToModelMapper {

    private DtoToModelMapper() {
    }

    public static UUID toModel(TodoItemCheckedEvent event) {
        return UUID.fromString(event.todoId());
    }
}
```

### 3.6 Outgoing web client adapter

```java
package com.example.todo.adapter.web.client;

import com.example.todo.core.port.TodoAuditClient;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
public class HttpTodoAuditClient implements TodoAuditClient {

    private final RestClient restClient;

    public HttpTodoAuditClient(RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public void notifyCreated(UUID todoId, String title) {
        restClient.post()
                .uri("/audit/todo-created")
                .body(new TodoCreatedAuditRequest(todoId, title))
                .retrieve()
                .toBodilessEntity();
    }
}
```

File: `adapter/web/client/TodoCreatedAuditRequest.java`

```java
package com.example.todo.adapter.web.client;

import java.util.UUID;

public record TodoCreatedAuditRequest(UUID todoId, String title) {
}
```

### 3.7 Outgoing database adapter

```java
package com.example.todo.adapter.persistence.postgres;

import com.example.todo.core.domain.model.TodoItem;
import com.example.todo.core.port.TodoItemRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class PostgresTodoItemRepository implements TodoItemRepository {

    private final TodoItemJpaRepository jpaRepository;

    public PostgresTodoItemRepository(TodoItemJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public TodoItem save(TodoItem item) {
        return EntityToModelMapper.toModel(
                jpaRepository.save(ModelToEntityMapper.toEntity(item))
        );
    }

    @Override
    public Optional<TodoItem> findById(UUID id) {
        return jpaRepository.findById(id)
                .map(EntityToModelMapper::toModel);
    }

    @Override
    public long countUncheckedByListId(UUID listId) {
        return jpaRepository.countByListIdAndCheckedFalse(listId);
    }
}
```

File: `adapter/persistence/postgres/jpa/TodoItemJpaRepository.java`

```java
package com.example.todo.adapter.persistence.postgres.jpa;

import com.example.todo.adapter.persistence.postgres.model.TodoItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TodoItemJpaRepository extends JpaRepository<TodoItemEntity, UUID> {
    long countByListIdAndCheckedFalse(UUID listId);
}
```

File: `adapter/persistence/postgres/model/TodoItemEntity.java`

```java
package com.example.todo.adapter.persistence.postgres.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "todo_item")
public class TodoItemEntity {

    @Id
    private UUID id;

    @Column(name = "list_id", nullable = false)
    private UUID listId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private boolean checked;

    protected TodoItemEntity() {
    }

    public TodoItemEntity(UUID id, UUID listId, String title, boolean checked) {
        this.id = id;
        this.listId = listId;
        this.title = title;
        this.checked = checked;
    }

    public UUID getId() {
        return id;
    }

    public UUID getListId() {
        return listId;
    }

    public String getTitle() {
        return title;
    }

    public boolean isChecked() {
        return checked;
    }
}
```

File: `adapter/persistence/postgres/EntityToModelMapper.java`

```java
package com.example.todo.adapter.persistence.postgres;

import com.example.todo.adapter.persistence.postgres.model.TodoItemEntity;
import com.example.todo.core.domain.model.TodoItem;

public final class EntityToModelMapper {

    private EntityToModelMapper() {
    }

    public static TodoItem toModel(TodoItemEntity entity) {
        return new TodoItem(
                entity.getId(),
                entity.getListId(),
                entity.getTitle(),
                entity.isChecked()
        );
    }
}
```

File: `adapter/persistence/postgres/ModelToEntityMapper.java`

```java
package com.example.todo.adapter.persistence.postgres;

import com.example.todo.adapter.persistence.postgres.model.TodoItemEntity;
import com.example.todo.core.domain.model.TodoItem;

public final class ModelToEntityMapper {

    private ModelToEntityMapper() {
    }

    public static TodoItemEntity toEntity(TodoItem model) {
        return new TodoItemEntity(
                model.id(),
                model.listId(),
                model.title(),
                model.checked()
        );
    }
}
```

## 4) Dependency direction checklist

- `core/domain/model`: no Spring/JPA/Kafka/HTTP types.
- `core/service`: depend only on domain models and `core/port`.
- `core/*`: no library-specific classes except:
  - `org.springframework.stereotype.Service`
  - `org.springframework.stereotype.Component`
  - `jakarta.transaction.Transactional`
- `adapter/*` mappings must live in directional mapper classes only:
  - `EntityToModelMapper.java`: only `toModel`
  - `ModelToEntityMapper.java`: only `toEntity`
  - `DtoToModelMapper.java`: only `toModel`
  - `ModelToDtoMapper.java`: only `toDto`
- Mapper classes are `final` with `private` constructors and `static` methods only.
- `application/configuration/*`: keep framework configuration and properties classes.
- `@ConfigurationProperties` values must be mapped to core options and passed to core methods as parameters.
- `adapter/rest/*` and `adapter/event/*`: call `core/service` directly.
- `adapter/web/*` and `adapter/persistence/*`: implement `core/port`.
- `application/configuration`: framework setup and bean wiring only.
- Use Java records for domain models, DTOs, event payloads, and value objects.
- Use classes (not records) for JPA entities that require a no-arg constructor.
