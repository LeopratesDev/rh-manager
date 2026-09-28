namespace RhManager.Application.Departments;

public record DepartmentResponse(int Id, string Name, int EmployeeCount);

public record SaveDepartmentRequest(string Name);
