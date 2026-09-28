namespace RhManager.Domain.Entities;

public class Department
{
    public int Id { get; set; }
    public required string Name { get; set; }

    public ICollection<Employee> Employees { get; set; } = [];
}
