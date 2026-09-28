using Microsoft.IdentityModel.JsonWebTokens;
using RhManager.Application.Auth;
using RhManager.Domain.Enums;
using RhManager.Infrastructure.Auth;

namespace RhManager.Api.Auth;

public class HttpCurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public int UserId => int.Parse(GetClaim(JwtRegisteredClaimNames.Sub)
        ?? throw new InvalidOperationException("Authenticated user has no subject claim."));

    public int? EmployeeId => int.TryParse(GetClaim(JwtTokenService.EmployeeIdClaim), out var id) ? id : null;

    public bool IsAdmin => GetClaim(JwtTokenService.RoleClaim) == nameof(UserRole.Admin);

    private string? GetClaim(string type) => httpContextAccessor.HttpContext?.User.FindFirst(type)?.Value;
}
