using RhManager.Domain.Enums;

namespace RhManager.Application.Employees;

public record EmployeeResponse(
    int Id,
    string Name,
    string Email,
    string Cpf,
    string Position,
    decimal Salary,
    DateOnly HireDate,
    EmployeeStatus Status,
    int DepartmentId,
    string DepartmentName);

public record SaveEmployeeRequest(
    string Name,
    string Email,
    string Cpf,
    string Position,
    decimal Salary,
    DateOnly HireDate,
    int DepartmentId,
    EmployeeStatus Status = EmployeeStatus.Active);

public record EmployeeQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    int? DepartmentId = null,
    EmployeeStatus? Status = null);
