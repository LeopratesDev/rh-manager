using FluentAssertions;
using RhManager.Application.Employees;

namespace RhManager.UnitTests.Validation;

public class SaveEmployeeRequestValidatorTests
{
    private readonly SaveEmployeeRequestValidator _validator = new();

    private static SaveEmployeeRequest ValidRequest() => new(
        Name: "Ana Souza",
        Email: "ana.souza@empresa.com",
        Cpf: "52601815906",
        Position: "Desenvolvedora",
        Salary: 5000m,
        HireDate: new DateOnly(2024, 1, 15),
        DepartmentId: 1);

    [Fact]
    public void Validate_WithValidRequest_HasNoErrors()
    {
        var result = _validator.Validate(ValidRequest());

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_WithInvalidCpf_ReturnsCpfError()
    {
        var result = _validator.Validate(ValidRequest() with { Cpf = "12345678900" });

        result.Errors.Should().ContainSingle(e => e.PropertyName == nameof(SaveEmployeeRequest.Cpf));
    }

    [Fact]
    public void Validate_WithMalformedEmail_ReturnsEmailError()
    {
        var result = _validator.Validate(ValidRequest() with { Email = "ana.souza" });

        result.Errors.Should().ContainSingle(e => e.PropertyName == nameof(SaveEmployeeRequest.Email));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public void Validate_WithNonPositiveSalary_ReturnsSalaryError(decimal salary)
    {
        var result = _validator.Validate(ValidRequest() with { Salary = salary });

        result.Errors.Should().ContainSingle(e => e.PropertyName == nameof(SaveEmployeeRequest.Salary));
    }

    [Fact]
    public void Validate_WithEmptyName_ReturnsNameError()
    {
        var result = _validator.Validate(ValidRequest() with { Name = "" });

        result.Errors.Should().ContainSingle(e => e.PropertyName == nameof(SaveEmployeeRequest.Name));
    }
}
