using RhManager.Domain.Enums;

namespace RhManager.Application.Auth;

public record LoginRequest(string Email, string Password);

public record LoginResponse(string AccessToken, DateTime ExpiresAt, UserResponse User);

public record UserResponse(int Id, string Email, UserRole Role, int? EmployeeId, string? EmployeeName);
