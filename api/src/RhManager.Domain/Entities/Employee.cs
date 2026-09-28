using RhManager.Domain.Enums;

namespace RhManager.Domain.Entities;

public class Employee
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Cpf { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public decimal Salary { get; set; }
    public DateOnly HireDate { get; set; }
    public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;

    public int DepartmentId { get; set; }
    public Department? Department { get; set; }

    public ICollection<VacationRequest> VacationRequests { get; set; } = [];
}
