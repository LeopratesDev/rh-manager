using Microsoft.AspNetCore.Identity;
using RhManager.Application.Auth;
using RhManager.Domain.Entities;

namespace RhManager.Infrastructure.Auth;

public class IdentityPasswordHasher : IPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(string password) => _hasher.HashPassword(null!, password);

    public bool Verify(string hashedPassword, string providedPassword) =>
        _hasher.VerifyHashedPassword(null!, hashedPassword, providedPassword) != PasswordVerificationResult.Failed;
}
