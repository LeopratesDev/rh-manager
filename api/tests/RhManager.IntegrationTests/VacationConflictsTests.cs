using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using RhManager.Application.Departments;
using RhManager.Application.Vacations;
using RhManager.Domain.Enums;

namespace RhManager.IntegrationTests;

public class VacationConflictsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static readonly DateOnly _base = DateOnly.FromDateTime(DateTime.Now).AddDays(10);

    private readonly HttpClient _admin = factory.CreateAdminClient();

    [Fact]
    public async Task ListConflicts_ReturnsOnlyActiveOverlapsFromTheSameDepartment()
    {
        var department = await TestData.CreateDepartmentAsync(_admin);
        var otherDepartment = await TestData.CreateDepartmentAsync(_admin);
        var target = await RequestAsync(department, 0, 9);
        var pendingColleague = await RequestAsync(department, -5, 1);
        var approvedColleague = await RequestAsync(department, 5, 14);
        await _admin.PostAsync($"/api/vacations/{approvedColleague.Id}/approve", null);
        var rejectedColleague = await RequestAsync(department, 2, 8);
        await _admin.PostAsJsonAsync($"/api/vacations/{rejectedColleague.Id}/reject", new RejectVacationRequest("Equipe reduzida"));
        await RequestAsync(department, 30, 39);
        await RequestAsync(otherDepartment, 0, 9);

        var conflicts = await _admin.GetFromJsonAsync<List<VacationResponse>>(
            $"/api/vacations/{target.Id}/conflicts", JsonOptions.Default);

        conflicts!.Select(c => (c.Id, c.Status)).Should().Equal(
            (pendingColleague.Id, VacationStatus.Pending),
            (approvedColleague.Id, VacationStatus.Approved));
    }

    [Fact]
    public async Task ListConflicts_WithoutColleaguesAway_ReturnsEmptyList()
    {
        var department = await TestData.CreateDepartmentAsync(_admin);
        var target = await RequestAsync(department, 0, 9);

        var conflicts = await _admin.GetFromJsonAsync<List<VacationResponse>>(
            $"/api/vacations/{target.Id}/conflicts", JsonOptions.Default);

        conflicts.Should().BeEmpty();
    }

    [Fact]
    public async Task ListConflicts_WithUnknownId_Returns404()
    {
        var response = await _admin.GetAsync("/api/vacations/999999/conflicts");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ListConflicts_WithEmployeeToken_Returns403()
    {
        var department = await TestData.CreateDepartmentAsync(_admin);
        var target = await RequestAsync(department, 0, 9);

        var response = await factory.CreateEmployeeClient(target.EmployeeId).GetAsync($"/api/vacations/{target.Id}/conflicts");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private async Task<VacationResponse> RequestAsync(DepartmentResponse department, int startOffset, int endOffset)
    {
        var employee = await TestData.CreateEmployeeAsync(_admin, TestData.NewEmployeeRequest(department.Id));
        var start = _base.AddDays(startOffset);
        var response = await factory.CreateEmployeeClient(employee.Id)
            .PostAsJsonAsync("/api/vacations", new CreateVacationRequest(start, _base.AddDays(endOffset)));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<VacationResponse>(JsonOptions.Default))!;
    }
}
