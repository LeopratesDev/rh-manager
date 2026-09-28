using System.Net.Http.Json;
using RhManager.Application.Departments;
using RhManager.Application.Employees;

namespace RhManager.IntegrationTests;

public static class TestData
{
    private static int _cpfSequence = 100_000_000;

    public static string UniqueName(string prefix) => $"{prefix} {Guid.NewGuid():N}"[..30];

    public static string NewValidCpf()
    {
        var baseDigits = Interlocked.Increment(ref _cpfSequence).ToString().Select(c => c - '0').ToList();
        baseDigits.Add(CheckDigit(baseDigits));
        baseDigits.Add(CheckDigit(baseDigits));
        return string.Concat(baseDigits);
    }

    public static SaveEmployeeRequest NewEmployeeRequest(int departmentId, string? name = null) => new(
        Name: name ?? UniqueName("Funcionario"),
        Email: $"{Guid.NewGuid():N}@teste.com",
        Cpf: NewValidCpf(),
        Position: "Analista",
        Salary: 4500.50m,
        HireDate: new DateOnly(2023, 5, 10),
        DepartmentId: departmentId);

    public static async Task<DepartmentResponse> CreateDepartmentAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/departments", new SaveDepartmentRequest(UniqueName("Depto")));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<DepartmentResponse>(JsonOptions.Default))!;
    }

    public static async Task<EmployeeResponse> CreateEmployeeAsync(HttpClient client, SaveEmployeeRequest request)
    {
        var response = await client.PostAsJsonAsync("/api/employees", request, JsonOptions.Default);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<EmployeeResponse>(JsonOptions.Default))!;
    }

    private static int CheckDigit(List<int> digits)
    {
        var sum = digits.Select((digit, index) => digit * (digits.Count + 1 - index)).Sum();
        var remainder = sum * 10 % 11;
        return remainder == 10 ? 0 : remainder;
    }
}
