using System.Linq.Expressions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using RhManager.Application.Common;
using RhManager.Application.Common.Exceptions;
using RhManager.Application.Common.Validation;
using RhManager.Domain.Entities;
using RhManager.Domain.Enums;

namespace RhManager.Application.Employees;

public interface IEmployeeService
{
    Task<PagedResult<EmployeeListItemResponse>> ListAsync(EmployeeQuery query, CancellationToken cancellationToken);
    Task<EmployeeResponse> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<EmployeeResponse> CreateAsync(SaveEmployeeRequest request, CancellationToken cancellationToken);
    Task UpdateAsync(int id, SaveEmployeeRequest request, CancellationToken cancellationToken);
    Task DeactivateAsync(int id, CancellationToken cancellationToken);
}

public class EmployeeService(
    IAppDbContext context,
    IValidator<SaveEmployeeRequest> requestValidator,
    IValidator<EmployeeQuery> queryValidator) : IEmployeeService
{
    private static readonly Expression<Func<Employee, EmployeeResponse>> _toResponse =
        e => new EmployeeResponse(
            e.Id, e.Name, e.Email, e.Cpf, e.Position, e.Salary, e.HireDate, e.Status,
            e.DepartmentId, e.Department!.Name);

    public async Task<PagedResult<EmployeeListItemResponse>> ListAsync(EmployeeQuery query, CancellationToken cancellationToken)
    {
        await queryValidator.ValidateAndThrowAsync(query, cancellationToken);

        var employees = context.Employees.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            employees = employees.Where(e => e.Name.Contains(query.Search.Trim()));
        }

        if (query.DepartmentId is not null)
        {
            employees = employees.Where(e => e.DepartmentId == query.DepartmentId);
        }

        if (query.Status is not null)
        {
            employees = employees.Where(e => e.Status == query.Status);
        }

        var totalItems = await employees.CountAsync(cancellationToken);
        var items = await employees
            .OrderBy(e => e.Name)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e => new EmployeeListItemResponse(
                e.Id, e.Name, e.Email, Cpf.Mask(e.Cpf), e.Position, e.HireDate, e.Status,
                e.DepartmentId, e.Department!.Name))
            .ToListAsync(cancellationToken);

        return new PagedResult<EmployeeListItemResponse>(items, query.Page, query.PageSize, totalItems);
    }

    public async Task<EmployeeResponse> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        await context.Employees
            .AsNoTracking()
            .Where(e => e.Id == id)
            .Select(_toResponse)
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException("Funcionário", id);

    public async Task<EmployeeResponse> CreateAsync(SaveEmployeeRequest request, CancellationToken cancellationToken)
    {
        await requestValidator.ValidateAndThrowAsync(request, cancellationToken);

        var employee = new Employee();
        await ApplyAsync(employee, request, cancellationToken);

        context.Employees.Add(employee);
        await context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(employee.Id, cancellationToken);
    }

    public async Task UpdateAsync(int id, SaveEmployeeRequest request, CancellationToken cancellationToken)
    {
        await requestValidator.ValidateAndThrowAsync(request, cancellationToken);
        var employee = await FindAsync(id, cancellationToken);

        await ApplyAsync(employee, request, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeactivateAsync(int id, CancellationToken cancellationToken)
    {
        var employee = await FindAsync(id, cancellationToken);

        employee.Status = EmployeeStatus.Inactive;
        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task<Employee> FindAsync(int id, CancellationToken cancellationToken) =>
        await context.Employees.FindAsync([id], cancellationToken)
        ?? throw new NotFoundException("Funcionário", id);

    private async Task ApplyAsync(Employee employee, SaveEmployeeRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var cpf = Cpf.OnlyDigits(request.Cpf);

        await EnsureDepartmentExistsAsync(request.DepartmentId, cancellationToken);
        await EnsureUniqueAsync(employee.Id, email, cpf, cancellationToken);

        employee.Name = request.Name.Trim();
        employee.Email = email;
        employee.Cpf = cpf;
        employee.Position = request.Position.Trim();
        employee.Salary = request.Salary;
        employee.HireDate = request.HireDate;
        employee.DepartmentId = request.DepartmentId;
        employee.Status = request.Status;
    }

    private async Task EnsureDepartmentExistsAsync(int departmentId, CancellationToken cancellationToken)
    {
        if (!await context.Departments.AnyAsync(d => d.Id == departmentId, cancellationToken))
        {
            throw new ValidationException(
                [new ValidationFailure(nameof(SaveEmployeeRequest.DepartmentId), "Departamento não encontrado.")]);
        }
    }

    private async Task EnsureUniqueAsync(int currentId, string email, string cpf, CancellationToken cancellationToken)
    {
        if (await context.Employees.AnyAsync(e => e.Email == email && e.Id != currentId, cancellationToken))
        {
            throw new ConflictException("Já existe um funcionário com este e-mail.");
        }

        if (await context.Employees.AnyAsync(e => e.Cpf == cpf && e.Id != currentId, cancellationToken))
        {
            throw new ConflictException("Já existe um funcionário com este CPF.");
        }
    }
}
