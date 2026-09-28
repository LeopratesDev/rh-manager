using RhManager.Domain.Enums;

namespace RhManager.Domain.Entities;

public class Employee
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Cpf { get; set; }
    public required string Position { get; set; }
    public decimal Salary { get; set; }
    public DateOnly HireDate { get; set; }
    public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;

    public int DepartmentId { get; set; }
    public Department? Department { get; set; }

    public ICollection<VacationRequest> VacationRequests { get; set; } = [];
}
