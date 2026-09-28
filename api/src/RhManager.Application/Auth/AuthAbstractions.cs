using RhManager.Domain.Entities;

namespace RhManager.Application.Auth;

public interface ICurrentUser
{
    int UserId { get; }
    int? EmployeeId { get; }
    bool IsAdmin { get; }
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string hashedPassword, string providedPassword);
}

public interface ITokenService
{
    AccessToken CreateToken(User user);
}

public record AccessToken(string Token, DateTime ExpiresAt);
