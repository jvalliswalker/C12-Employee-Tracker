DROP DATABASE IF EXISTS employee_tracker;

CREATE DATABASE employee_tracker;

\c employee_tracker

DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS departments;


CREATE TABLE departments (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE roles (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(30) UNIQUE NOT NULL,
    salary          DECIMAL NOT NULL,
    department_id   INTEGER NOT NULL,
    CONSTRAINT fk_department
        FOREIGN KEY(department_id)
            REFERENCES departments(id)
);

CREATE TABLE employees (
    id              SERIAL PRIMARY KEY,
    first_name      VARCHAR(30) NOT NULL,
    last_name       VARCHAR(30) NOT NULL,
    role_id         INTEGER NOT NULL,
    manager_id      INTEGER,
    CONSTRAINT fk_role
        FOREIGN KEY(role_id)
            REFERENCES roles(id),
    CONSTRAINT fk_manager
        FOREIGN KEY(manager_id)
            REFERENCES employees(id)
)