---
name: java-hexagonal-architecture
description: Design, review, or refactor Java/Spring codebases to strict hexagonal architecture with clear domain, ports, and adapters. Use when creating new modules, restructuring package layout, defining incoming/outgoing adapters (web, Kafka, HTTP clients, database), or enforcing boundaries with ArchUnit and dependency rules.
---

# Java Hexagonal Architecture

## Workflow

1. Inspect current package structure and map it to hexagonal layers:
   - `core/domain/model` -> domain models and value objects
   - `core/port` -> interfaces for outbound dependencies
   - `core/service` -> use cases/application orchestration
   - `adapter/...` -> technical implementations of ports
   - `application/configuration` -> wiring and framework setup
2. Keep business logic in `core` and keep framework/IO code in `adapter` and `application`.
3. Define ports first, then implement technology-specific adapters.
4. Add mapping boundaries:
   - inbound DTO/event -> domain model before invoking `core/service`
   - domain model -> outbound DTO/entity before calling external systems
   - implement mappings in dedicated adapter mapper classes by direction:
     - `EntityToModelMapper.java` contains only `toModel` methods
     - `DtoToModelMapper.java` contains only `toModel` methods
     - `ModelToEntityMapper.java` contains only `toEntity` methods
     - `ModelToDtoMapper.java` contains only `toDto` methods
   - mapper classes contain only `static` methods; do not instantiate them
5. Enforce boundaries with ArchUnit tests and package conventions.
6. Keep configuration in `application/configuration` and pass runtime config into `core/service` as explicit options parameters.

## Target Package Layout

Use this generic layout (adapt package prefixes as needed):

```text
com.example.app
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

## Design Rules

- Keep ports as interfaces in `core/port`.
- Do not create inbound port interfaces; inbound adapters call `core/service` directly.
- Keep adapters as concrete classes implementing ports.
- Avoid direct dependency from `core` to adapter-specific types (Feign clients, JPA repositories, Kafka classes, Spring MVC annotations).
- Do not use library-specific classes in `core` except these annotations:
  - `org.springframework.stereotype.Service`
  - `org.springframework.stereotype.Component`
  - `jakarta.transaction.Transactional`
- Keep JPA entities and API DTOs outside `core/domain/model`.
- Keep use case coordination in `core/service`; no HTTP/Kafka/SQL code there.
- Keep mapping code inside adapter packages in dedicated directional mapper classes.
- Use directional mapper class names and contents only:
  - `EntityToModelMapper.java` -> only `toModel` methods
  - `ModelToEntityMapper.java` -> only `toEntity` methods
  - `DtoToModelMapper.java` -> only `toModel` methods
  - `ModelToDtoMapper.java` -> only `toDto` methods
- Write mapper methods as `static` methods in final utility classes with private constructors:
  - `public static MyModel toModel(MyEntity entity)`
  - `public static MyEntity toEntity(MyModel model)`
- Use Java records for domain models, value objects, DTOs, and event payloads where possible. Use records when the type is a plain data carrier with no mutable state.
- Use classes (not records) for JPA entities, since JPA requires a no-arg constructor and mutable fields.
- Keep Spring `@ConfigurationProperties` classes outside `core`.
- Do not inject properties directly into core services; map them to core options objects and pass as method parameters.

## Simple Scenario Scope

When generating examples or scaffolding, keep scope intentionally small:

- Incoming adapter: one web controller
- Incoming adapter: one Kafka listener
- Outgoing adapter: one web service client
- Outgoing adapter: one database adapter

Use generic domain names (`Order`, `Customer`, `Invoice`, `Task`) and do not reuse project-specific business terms.

## References

- Read `references/package-structure.md` for:
  - generic package mapping and layer responsibilities
  - class-type examples for domain, services, ports, and adapters
  - a simple end-to-end Todo sample (REST create + Kafka checked event + DB save)
