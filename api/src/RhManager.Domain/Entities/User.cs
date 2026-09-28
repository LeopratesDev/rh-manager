using RhManager.Domain.Enums;

namespace RhManager.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public UserRole Role { get; set; }

    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }
}
