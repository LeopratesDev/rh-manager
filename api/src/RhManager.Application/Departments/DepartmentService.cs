using FluentValidation;
using Microsoft.EntityFrameworkCore;
using RhManager.Application.Common;
using RhManager.Application.Common.Exceptions;
using RhManager.Domain.Entities;

namespace RhManager.Application.Departments;

public interface IDepartmentService
{
    Task<IReadOnlyList<DepartmentResponse>> ListAsync(CancellationToken cancellationToken);
    Task<DepartmentResponse> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<DepartmentResponse> CreateAsync(SaveDepartmentRequest request, CancellationToken cancellationToken);
    Task UpdateAsync(int id, SaveDepartmentRequest request, CancellationToken cancellationToken);
    Task DeleteAsync(int id, CancellationToken cancellationToken);
}

public class DepartmentService(IAppDbContext context, IValidator<SaveDepartmentRequest> validator) : IDepartmentService
{
    public async Task<IReadOnlyList<DepartmentResponse>> ListAsync(CancellationToken cancellationToken) =>
        await context.Departments
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentResponse(d.Id, d.Name, d.Employees.Count))
            .ToListAsync(cancellationToken);

    public async Task<DepartmentResponse> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        await context.Departments
            .Where(d => d.Id == id)
            .Select(d => new DepartmentResponse(d.Id, d.Name, d.Employees.Count))
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException("Departamento", id);

    public async Task<DepartmentResponse> CreateAsync(SaveDepartmentRequest request, CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var name = request.Name.Trim();
        await EnsureNameIsAvailableAsync(name, null, cancellationToken);

        var department = new Department { Name = name };
        context.Departments.Add(department);
        await context.SaveChangesAsync(cancellationToken);

        return new DepartmentResponse(department.Id, department.Name, 0);
    }

    public async Task UpdateAsync(int id, SaveDepartmentRequest request, CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var department = await FindAsync(id, cancellationToken);
        var name = request.Name.Trim();
        await EnsureNameIsAvailableAsync(name, id, cancellationToken);

        department.Name = name;
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var department = await FindAsync(id, cancellationToken);

        if (await context.Employees.AnyAsync(e => e.DepartmentId == id, cancellationToken))
        {
            throw new ConflictException("Não é possível excluir um departamento que possui funcionários.");
        }

        context.Departments.Remove(department);
        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task<Department> FindAsync(int id, CancellationToken cancellationToken) =>
        await context.Departments.FindAsync([id], cancellationToken)
        ?? throw new NotFoundException("Departamento", id);

    private async Task EnsureNameIsAvailableAsync(string name, int? currentId, CancellationToken cancellationToken)
    {
        if (await context.Departments.AnyAsync(d => d.Name == name && d.Id != currentId, cancellationToken))
        {
            throw new ConflictException($"Já existe um departamento com o nome '{name}'.");
        }
    }
}
