using System.Linq.Expressions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using RhManager.Application.Common;
using RhManager.Application.Common.Exceptions;
using RhManager.Domain.Entities;
using RhManager.Domain.Enums;
using RhManager.Domain.Vacations;

namespace RhManager.Application.Vacations;

public interface IVacationService
{
    Task<IReadOnlyList<VacationResponse>> ListAsync(VacationStatus? status, int? employeeId, CancellationToken cancellationToken);
    Task<VacationResponse> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<VacationResponse> CreateAsync(CreateVacationRequest request, CancellationToken cancellationToken);
    Task ApproveAsync(int id, CancellationToken cancellationToken);
    Task RejectAsync(int id, RejectVacationRequest request, CancellationToken cancellationToken);
}

public class VacationService(
    IAppDbContext context,
    TimeProvider timeProvider,
    IValidator<CreateVacationRequest> createValidator,
    IValidator<RejectVacationRequest> rejectValidator) : IVacationService
{
    private static readonly Expression<Func<VacationRequest, VacationResponse>> _toResponse =
        v => new VacationResponse(
            v.Id, v.EmployeeId, v.Employee!.Name, v.StartDate, v.EndDate, v.Status, v.RejectionReason, v.CreatedAt, v.ReviewedAt);

    public async Task<IReadOnlyList<VacationResponse>> ListAsync(
        VacationStatus? status, int? employeeId, CancellationToken cancellationToken)
    {
        var vacations = context.VacationRequests.AsNoTracking();

        if (status is not null)
        {
            vacations = vacations.Where(v => v.Status == status);
        }

        if (employeeId is not null)
        {
            vacations = vacations.Where(v => v.EmployeeId == employeeId);
        }

        return await vacations
            .OrderBy(v => v.StartDate)
            .Select(_toResponse)
            .ToListAsync(cancellationToken);
    }

    public async Task<VacationResponse> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        await context.VacationRequests
            .AsNoTracking()
            .Where(v => v.Id == id)
            .Select(_toResponse)
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException("Solicitação de férias", id);

    public async Task<VacationResponse> CreateAsync(CreateVacationRequest request, CancellationToken cancellationToken)
    {
        await createValidator.ValidateAndThrowAsync(request, cancellationToken);
        var employee = await FindActiveEmployeeAsync(request.EmployeeId, cancellationToken);

        var now = timeProvider.GetLocalNow().DateTime;
        var policyErrors = VacationPolicy.Validate(request.StartDate, request.EndDate, employee.HireDate, DateOnly.FromDateTime(now));
        if (policyErrors.Count > 0)
        {
            throw new ValidationException(policyErrors.Select(error => new ValidationFailure("period", error)));
        }

        await EnsureNoOverlapAsync(request, cancellationToken);

        var vacation = new VacationRequest
        {
            EmployeeId = employee.Id,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            CreatedAt = now
        };
        context.VacationRequests.Add(vacation);
        await context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(vacation.Id, cancellationToken);
    }

    public async Task ApproveAsync(int id, CancellationToken cancellationToken)
    {
        var vacation = await FindAsync(id, cancellationToken);

        vacation.Approve(timeProvider.GetLocalNow().DateTime);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task RejectAsync(int id, RejectVacationRequest request, CancellationToken cancellationToken)
    {
        await rejectValidator.ValidateAndThrowAsync(request, cancellationToken);
        var vacation = await FindAsync(id, cancellationToken);

        vacation.Reject(request.Reason, timeProvider.GetLocalNow().DateTime);
        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task<VacationRequest> FindAsync(int id, CancellationToken cancellationToken) =>
        await context.VacationRequests.FindAsync([id], cancellationToken)
        ?? throw new NotFoundException("Solicitação de férias", id);

    private async Task<Employee> FindActiveEmployeeAsync(int employeeId, CancellationToken cancellationToken)
    {
        var employee = await context.Employees.FindAsync([employeeId], cancellationToken);
        if (employee is null || employee.Status != EmployeeStatus.Active)
        {
            throw new ValidationException(
                [new ValidationFailure(nameof(CreateVacationRequest.EmployeeId), "Funcionário não encontrado ou inativo.")]);
        }

        return employee;
    }

    private async Task EnsureNoOverlapAsync(CreateVacationRequest request, CancellationToken cancellationToken)
    {
        var overlaps = await context.VacationRequests.AnyAsync(v =>
            v.EmployeeId == request.EmployeeId &&
            (v.Status == VacationStatus.Pending || v.Status == VacationStatus.Approved) &&
            v.StartDate <= request.EndDate &&
            request.StartDate <= v.EndDate,
            cancellationToken);

        if (overlaps)
        {
            throw new ConflictException("O período solicitado se sobrepõe a outra solicitação pendente ou aprovada.");
        }
    }
}
