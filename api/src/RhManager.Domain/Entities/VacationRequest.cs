using RhManager.Domain.Common;
using RhManager.Domain.Enums;

namespace RhManager.Domain.Entities;

public class VacationRequest
{
    public int Id { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public VacationStatus Status { get; private set; } = VacationStatus.Pending;
    public string? RejectionReason { get; private set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; private set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public void Approve(DateTime reviewedAt)
    {
        EnsurePending();
        Status = VacationStatus.Approved;
        ReviewedAt = reviewedAt;
    }

    public void Reject(string reason, DateTime reviewedAt)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new DomainException("O motivo da rejeição é obrigatório.");
        }

        EnsurePending();
        Status = VacationStatus.Rejected;
        RejectionReason = reason.Trim();
        ReviewedAt = reviewedAt;
    }

    private void EnsurePending()
    {
        if (Status != VacationStatus.Pending)
        {
            throw new DomainException("Somente solicitações pendentes podem ser aprovadas ou rejeitadas.");
        }
    }
}
