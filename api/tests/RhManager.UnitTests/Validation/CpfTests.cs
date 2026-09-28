using FluentAssertions;
using RhManager.Application.Common.Validation;

namespace RhManager.UnitTests.Validation;

public class CpfTests
{
    [Theory]
    [InlineData("52601815906")]
    [InlineData("526.018.159-06")]
    [InlineData("03137215994")]
    public void IsValid_WithCorrectCheckDigits_ReturnsTrue(string cpf)
    {
        Cpf.IsValid(cpf).Should().BeTrue();
    }

    [Theory]
    [InlineData("52601815907")]
    [InlineData("52601815916")]
    [InlineData("11111111111")]
    [InlineData("5260181590")]
    [InlineData("")]
    [InlineData(null)]
    public void IsValid_WithWrongDigitsRepeatedDigitsOrWrongLength_ReturnsFalse(string? cpf)
    {
        Cpf.IsValid(cpf).Should().BeFalse();
    }

    [Fact]
    public void OnlyDigits_WithFormattedCpf_RemovesPunctuation()
    {
        Cpf.OnlyDigits("526.018.159-06").Should().Be("52601815906");
    }
}
