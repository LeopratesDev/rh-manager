namespace RhManager.Domain.Vacations;

public static class VacationPolicy
{
    public const int MinDays = 5;
    public const int MaxDays = 30;
    public const int MonthsBeforeEligible = 12;

    public static IReadOnlyList<string> Validate(DateOnly startDate, DateOnly endDate, DateOnly hireDate, DateOnly today)
    {
        var errors = new List<string>();

        if (endDate < startDate)
        {
            errors.Add("A data final deve ser igual ou posterior à data inicial.");
            return errors;
        }

        var days = CountDays(startDate, endDate);
        if (days is < MinDays or > MaxDays)
        {
            errors.Add($"As férias devem ter entre {MinDays} e {MaxDays} dias (solicitado: {days}).");
        }

        if (startDate < today)
        {
            errors.Add("As férias não podem começar no passado.");
        }

        if (today < hireDate.AddMonths(MonthsBeforeEligible))
        {
            errors.Add($"Férias só podem ser solicitadas após {MonthsBeforeEligible} meses de admissão.");
        }

        return errors;
    }

    public static int CountDays(DateOnly startDate, DateOnly endDate) =>
        endDate.DayNumber - startDate.DayNumber + 1;
}
