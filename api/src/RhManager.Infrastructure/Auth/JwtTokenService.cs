using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using RhManager.Application.Auth;
using RhManager.Domain.Entities;

namespace RhManager.Infrastructure.Auth;

public class JwtTokenService(IOptions<JwtOptions> options, TimeProvider timeProvider) : ITokenService
{
    public const string EmployeeIdClaim = "employee_id";
    public const string RoleClaim = "role";

    private readonly JwtOptions _options = options.Value;

    public AccessToken CreateToken(User user)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var expiresAt = now.AddMinutes(_options.ExpirationMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(RoleClaim, user.Role.ToString())
        };

        if (user.EmployeeId is not null)
        {
            claims.Add(new Claim(EmployeeIdClaim, user.EmployeeId.Value.ToString()));
        }

        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = _options.Issuer,
            Audience = _options.Audience,
            Subject = new ClaimsIdentity(claims),
            IssuedAt = now,
            NotBefore = now,
            Expires = expiresAt,
            SigningCredentials = new SigningCredentials(CreateSigningKey(_options.Key), SecurityAlgorithms.HmacSha256)
        };

        return new AccessToken(new JsonWebTokenHandler().CreateToken(descriptor), expiresAt);
    }

    public static SymmetricSecurityKey CreateSigningKey(string key) => new(Encoding.UTF8.GetBytes(key));
}
