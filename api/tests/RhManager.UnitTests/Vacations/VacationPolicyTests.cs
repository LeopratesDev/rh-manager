using FluentAssertions;
using RhManager.Domain.Vacations;

namespace RhManager.UnitTests.Vacations;

public class VacationPolicyTests
{
    private static readonly DateOnly _today = new(2026, 9, 28);
    private static readonly DateOnly _eligibleHireDate = new(2024, 1, 10);
    private static readonly DateOnly _nextMonth = _today.AddMonths(1);

    [Theory]
    [InlineData(5)]
    [InlineData(30)]
    public void Validate_WithDurationWithinLimits_ReturnsNoErrors(int days)
    {
        var errors = VacationPolicy.Validate(_nextMonth, _nextMonth.AddDays(days - 1), _eligibleHireDate, _today);

        errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData(4)]
    [InlineData(31)]
    public void Validate_WithDurationOutsideLimits_ReturnsDurationError(int days)
    {
        var errors = VacationPolicy.Validate(_nextMonth, _nextMonth.AddDays(days - 1), _eligibleHireDate, _today);

        errors.Should().ContainSingle().Which.Should().Contain("entre 5 e 30 dias");
    }

    [Fact]
    public void Validate_StartingToday_ReturnsNoErrors()
    {
        var errors = VacationPolicy.Validate(_today, _today.AddDays(9), _eligibleHireDate, _today);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void Validate_StartingYesterday_ReturnsPastDateError()
    {
        var yesterday = _today.AddDays(-1);

        var errors = VacationPolicy.Validate(yesterday, yesterday.AddDays(9), _eligibleHireDate, _today);

        errors.Should().ContainSingle().Which.Should().Contain("passado");
    }

    [Fact]
    public void Validate_RequestedExactlyTwelveMonthsAfterHire_ReturnsNoErrors()
    {
        var hireDate = _today.AddMonths(-12);

        var errors = VacationPolicy.Validate(_nextMonth, _nextMonth.AddDays(9), hireDate, _today);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void Validate_RequestedOneDayBeforeTwelveMonthsOfHire_ReturnsEligibilityError()
    {
        var hireDate = _today.AddMonths(-12).AddDays(1);

        var errors = VacationPolicy.Validate(_nextMonth, _nextMonth.AddDays(9), hireDate, _today);

        errors.Should().ContainSingle().Which.Should().Contain("12 meses");
    }

    [Fact]
    public void Validate_WithEndBeforeStart_ReturnsOnlyDateOrderError()
    {
        var errors = VacationPolicy.Validate(_nextMonth, _nextMonth.AddDays(-1), _eligibleHireDate, _today);

        errors.Should().ContainSingle().Which.Should().Contain("data final");
    }

    [Fact]
    public void CountDays_WithSameStartAndEnd_CountsBothEnds()
    {
        VacationPolicy.CountDays(_today, _today.AddDays(4)).Should().Be(5);
    }
}
