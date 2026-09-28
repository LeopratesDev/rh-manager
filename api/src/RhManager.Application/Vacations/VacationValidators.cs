using FluentValidation;

namespace RhManager.Application.Vacations;

public class CreateVacationRequestValidator : AbstractValidator<CreateVacationRequest>
{
    public CreateVacationRequestValidator()
    {
        RuleFor(x => x.StartDate).NotEmpty();
        RuleFor(x => x.EndDate).NotEmpty();
    }
}

public class RejectVacationRequestValidator : AbstractValidator<RejectVacationRequest>
{
    public RejectVacationRequestValidator()
    {
        RuleFor(x => x.Reason).NotEmpty().WithMessage("O motivo da rejeição é obrigatório.").MaximumLength(500);
    }
}
