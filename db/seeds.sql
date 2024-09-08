\c employee_tracker

DELETE FROM departments;
DELETE FROM roles;
DELETE FROM employees;

INSERT INTO departments (name) VALUES
    ('Engineering'),
    ('Finance'),
    ('Human Resources'),
    ('Events & Outreach');