# CLAUDE.md

This application is a Java / Spring Boot app that is responsible for managing personal finance and budgeting.

## Technologies

* Java 21
* Spring Boot 4
* Maven
* Postgres
* Thymeleaf for UI
* Spring Security

### Unit Tests

Use the java-unit-test skill to learn how to write unit tests.

### Architecture 

Use the java-hexagonal-architecture skill to learn about the architecture

## Features

* Setting a monthly budget
* Saving goals
* Keeping track of expenses
* Group expenses by category
* Login via simple username + password that are configured in application.yaml

## Commands

* Start Postgres: `docker compose up -d`
* Build: `./mvnw compile`
* Run: `./mvnw spring-boot:run`
* Test all: `./mvnw test`
* Test single class: `./mvnw test -Dtest=ClassName`
* Package: `./mvnw package`

## Glossary

* Expense: Money spent on something
* Budget: Monthly amount of money you can spend