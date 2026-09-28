using RhManager.Domain.Enums;
using RhManager.Domain.Vacations;

namespace RhManager.Application.Vacations;

public record VacationResponse(
    int Id,
    int EmployeeId,
    string EmployeeName,
    DateOnly StartDate,
    DateOnly EndDate,
    VacationStatus Status,
    string? RejectionReason,
    DateTime CreatedAt,
    DateTime? ReviewedAt)
{
    public int Days => VacationPolicy.CountDays(StartDate, EndDate);
}

public record CreateVacationRequest(int EmployeeId, DateOnly StartDate, DateOnly EndDate);

public record RejectVacationRequest(string Reason);
