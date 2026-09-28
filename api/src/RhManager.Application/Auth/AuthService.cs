using FluentValidation;
using Microsoft.EntityFrameworkCore;
using RhManager.Application.Common;
using RhManager.Application.Common.Exceptions;
using RhManager.Domain.Enums;

namespace RhManager.Application.Auth;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<UserResponse> GetCurrentUserAsync(CancellationToken cancellationToken);
}

public class AuthService(
    IAppDbContext context,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    ICurrentUser currentUser,
    IValidator<LoginRequest> validator) : IAuthService
{
    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await context.Users
            .Include(u => u.Employee)
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

        if (user is null
            || !passwordHasher.Verify(user.PasswordHash, request.Password)
            || user.Employee?.Status == EmployeeStatus.Inactive)
        {
            throw new UnauthorizedException("E-mail ou senha inválidos.");
        }

        var token = tokenService.CreateToken(user);
        return new LoginResponse(token.Token, token.ExpiresAt, ToResponse(user));
    }

    public async Task<UserResponse> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        var user = await context.Users
            .AsNoTracking()
            .Include(u => u.Employee)
            .FirstOrDefaultAsync(u => u.Id == currentUser.UserId, cancellationToken)
            ?? throw new UnauthorizedException("Usuário não encontrado.");

        return ToResponse(user);
    }

    private static UserResponse ToResponse(Domain.Entities.User user) =>
        new(user.Id, user.Email, user.Role, user.EmployeeId, user.Employee?.Name);
}
