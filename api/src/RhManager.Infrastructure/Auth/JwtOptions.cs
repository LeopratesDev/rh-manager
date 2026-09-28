using System.ComponentModel.DataAnnotations;

namespace RhManager.Infrastructure.Auth;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required]
    public string Issuer { get; init; } = string.Empty;

    [Required]
    public string Audience { get; init; } = string.Empty;

    [Required]
    [MinLength(32, ErrorMessage = "Jwt:Key must have at least 32 characters.")]
    public string Key { get; init; } = string.Empty;

    [Range(1, 1440)]
    public int ExpirationMinutes { get; init; } = 60;
}
