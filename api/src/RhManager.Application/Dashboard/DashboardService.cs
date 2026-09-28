using Microsoft.EntityFrameworkCore;
using RhManager.Application.Common;
using RhManager.Domain.Enums;

namespace RhManager.Application.Dashboard;

public record DepartmentHeadcount(int DepartmentId, string DepartmentName, int ActiveEmployees);

public record UpcomingVacation(int Id, int EmployeeId, string EmployeeName, DateOnly StartDate, DateOnly EndDate);

public record DashboardResponse(
    int TotalActiveEmployees,
    int PendingVacations,
    IReadOnlyList<DepartmentHeadcount> EmployeesByDepartment,
    IReadOnlyList<UpcomingVacation> UpcomingVacations);

public interface IDashboardService
{
    Task<DashboardResponse> GetAsync(CancellationToken cancellationToken);
}

public class DashboardService(IAppDbContext context, TimeProvider timeProvider) : IDashboardService
{
    public const int UpcomingVacationsLimit = 5;

    public async Task<DashboardResponse> GetAsync(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(timeProvider.GetLocalNow().DateTime);

        var headcounts = await context.Departments
            .AsNoTracking()
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentHeadcount(
                d.Id, d.Name, d.Employees.Count(e => e.Status == EmployeeStatus.Active)))
            .ToListAsync(cancellationToken);

        var pendingVacations = await context.VacationRequests
            .CountAsync(v => v.Status == VacationStatus.Pending, cancellationToken);

        var upcomingVacations = await context.VacationRequests
            .AsNoTracking()
            .Where(v => v.Status == VacationStatus.Approved && v.EndDate >= today)
            .OrderBy(v => v.StartDate)
            .Take(UpcomingVacationsLimit)
            .Select(v => new UpcomingVacation(v.Id, v.EmployeeId, v.Employee!.Name, v.StartDate, v.EndDate))
            .ToListAsync(cancellationToken);

        return new DashboardResponse(
            headcounts.Sum(h => h.ActiveEmployees), pendingVacations, headcounts, upcomingVacations);
    }
}
