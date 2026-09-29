namespace RhManager.Application.Common.Validation;

public static class Cpf
{
    public static string OnlyDigits(string value) => new(value.Where(char.IsAsciiDigit).ToArray());

    /// <summary>Mostra só os 6 dígitos do meio (ex.: ***.018.159-**), para listagens.</summary>
    public static string Mask(string value)
    {
        var digits = OnlyDigits(value);
        return digits.Length == 11 ? $"***.{digits[3..6]}.{digits[6..9]}-**" : "***.***.***-**";
    }

    public static bool IsValid(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var digits = OnlyDigits(value);
        if (digits.Length != 11 || digits.Distinct().Count() == 1)
        {
            return false;
        }

        var numbers = digits.Select(c => c - '0').ToArray();
        return numbers[9] == CheckDigit(numbers, 9) && numbers[10] == CheckDigit(numbers, 10);
    }

    private static int CheckDigit(int[] numbers, int length)
    {
        var sum = 0;
        for (var i = 0; i < length; i++)
        {
            sum += numbers[i] * (length + 1 - i);
        }

        var remainder = sum * 10 % 11;
        return remainder == 10 ? 0 : remainder;
    }
}
