using FluentAssertions;
using RhManager.Domain.Common;
using RhManager.Domain.Entities;
using RhManager.Domain.Enums;

namespace RhManager.UnitTests.Vacations;

public class VacationRequestTests
{
    private static readonly DateTime _reviewedAt = new(2026, 9, 28, 10, 0, 0);

    [Fact]
    public void Approve_WhenPending_SetsApprovedAndReviewDate()
    {
        var vacation = new VacationRequest();

        vacation.Approve(_reviewedAt);

        vacation.Status.Should().Be(VacationStatus.Approved);
        vacation.ReviewedAt.Should().Be(_reviewedAt);
    }

    [Fact]
    public void Approve_WhenAlreadyRejected_ThrowsDomainException()
    {
        var vacation = new VacationRequest();
        vacation.Reject("Período de fechamento", _reviewedAt);

        var act = () => vacation.Approve(_reviewedAt);

        act.Should().Throw<DomainException>();
        vacation.Status.Should().Be(VacationStatus.Rejected);
    }

    [Fact]
    public void Reject_WithReason_SetsRejectedAndTrimmedReason()
    {
        var vacation = new VacationRequest();

        vacation.Reject("  Período de fechamento  ", _reviewedAt);

        vacation.Status.Should().Be(VacationStatus.Rejected);
        vacation.RejectionReason.Should().Be("Período de fechamento");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Reject_WithoutReason_ThrowsDomainExceptionAndStaysPending(string reason)
    {
        var vacation = new VacationRequest();

        var act = () => vacation.Reject(reason, _reviewedAt);

        act.Should().Throw<DomainException>().WithMessage("*motivo*");
        vacation.Status.Should().Be(VacationStatus.Pending);
    }

    [Fact]
    public void Reject_WhenAlreadyApproved_ThrowsDomainException()
    {
        var vacation = new VacationRequest();
        vacation.Approve(_reviewedAt);

        var act = () => vacation.Reject("Mudança de planos", _reviewedAt);

        act.Should().Throw<DomainException>();
    }
}
