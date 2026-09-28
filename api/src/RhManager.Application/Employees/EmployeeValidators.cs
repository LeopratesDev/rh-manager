using FluentValidation;
using RhManager.Application.Common.Validation;

namespace RhManager.Application.Employees;

public class SaveEmployeeRequestValidator : AbstractValidator<SaveEmployeeRequest>
{
    public SaveEmployeeRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(x => x.Cpf).Must(Cpf.IsValid).WithMessage("CPF inválido.");
        RuleFor(x => x.Position).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Salary).GreaterThan(0);
        RuleFor(x => x.HireDate).NotEmpty();
        RuleFor(x => x.DepartmentId).GreaterThan(0);
        RuleFor(x => x.Status).IsInEnum();
    }
}

public class EmployeeQueryValidator : AbstractValidator<EmployeeQuery>
{
    public const int MaxPageSize = 50;

    public EmployeeQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, MaxPageSize);
        RuleFor(x => x.Status).IsInEnum();
    }
}
