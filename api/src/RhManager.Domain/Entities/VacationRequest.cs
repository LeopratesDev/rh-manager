using RhManager.Domain.Enums;

namespace RhManager.Domain.Entities;

public class VacationRequest
{
    public int Id { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public VacationStatus Status { get; set; } = VacationStatus.Pending;
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }
}
