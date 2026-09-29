using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using RhManager.Application.Dashboard;
using RhManager.Application.Employees;
using RhManager.Application.Vacations;
using RhManager.Domain.Enums;

namespace RhManager.IntegrationTests;

public class DashboardEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static readonly DateOnly _today = DateOnly.FromDateTime(DateTime.Now);
    private static readonly DateOnly _nextMonth = _today.AddMonths(1);

    private readonly HttpClient _admin = factory.CreateAdminClient();

    [Fact]
    public async Task Get_WithSeededData_CountsOnlyActiveEmployeesPerDepartment()
    {
        var dashboard = await GetDashboardAsync();

        dashboard.EmployeesByDepartment.Should().ContainEquivalentOf(new { DepartmentName = "Tecnologia", ActiveEmployees = 7 });
        dashboard.EmployeesByDepartment.Should().ContainEquivalentOf(new { DepartmentName = "Recursos Humanos", ActiveEmployees = 5 });
        dashboard.EmployeesByDepartment.Should().ContainEquivalentOf(new { DepartmentName = "Financeiro", ActiveEmployees = 6 });
        dashboard.TotalActiveEmployees.Should().Be(dashboard.EmployeesByDepartment.Sum(d => d.ActiveEmployees));
    }

    [Fact]
    public async Task Get_WithDepartmentWithoutActiveEmployees_ListsItWithZero()
    {
        var department = await TestData.CreateDepartmentAsync(_admin);
        var employee = await TestData.CreateEmployeeAsync(_admin, TestData.NewEmployeeRequest(department.Id));
        await _admin.DeleteAsync($"/api/employees/{employee.Id}");

        var dashboard = await GetDashboardAsync();

        dashboard.EmployeesByDepartment.Should().ContainSingle(d => d.DepartmentId == department.Id)
            .Which.ActiveEmployees.Should().Be(0);
    }

    [Fact]
    public async Task Get_AfterNewPendingRequest_IncrementsPendingCountButNotUpcoming()
    {
        var before = await GetDashboardAsync();
        var employee = await CreateEmployeeAsync();

        var vacation = await RequestVacationAsync(employee.Id, 0);

        var after = await GetDashboardAsync();
        after.PendingVacations.Should().Be(before.PendingVacations + 1);
        after.UpcomingVacations.Should().NotContain(v => v.Id == vacation.Id);
    }

    [Fact]
    public async Task Get_WithManyApprovedRequests_ReturnsFirstFiveOrderedByStartDate()
    {
        for (var i = 0; i < DashboardService.UpcomingVacationsLimit + 1; i++)
        {
            var employee = await CreateEmployeeAsync();
            var vacation = await RequestVacationAsync(employee.Id, i);
            await _admin.PostAsync($"/api/vacations/{vacation.Id}/approve", null);
        }

        var dashboard = await GetDashboardAsync();

        dashboard.UpcomingVacations.Should().HaveCount(DashboardService.UpcomingVacationsLimit)
            .And.BeInAscendingOrder(v => v.StartDate);
        dashboard.UpcomingVacations[0].StartDate.Should().BeOnOrBefore(_nextMonth);
    }

    [Fact]
    public async Task Get_Always_ReturnsTwentyEightDayWindowStartingToday()
    {
        var dashboard = await GetDashboardAsync();

        dashboard.WindowStart.Should().Be(_today);
        dashboard.WindowEnd.Should().Be(_today.AddDays(DashboardService.AbsenceWindowDays - 1));
    }

    [Fact]
    public async Task Get_WithRequestsAroundTheWindow_ListsOnlyActiveOnesThatOverlapIt()
    {
        var approved = await RequestVacationStartingAsync(_today.AddDays(3));
        await _admin.PostAsync($"/api/vacations/{approved.Id}/approve", null);
        var pending = await RequestVacationStartingAsync(_today.AddDays(20));
        var rejected = await RequestVacationStartingAsync(_today.AddDays(5));
        await _admin.PostAsJsonAsync($"/api/vacations/{rejected.Id}/reject", new RejectVacationRequest("Equipe reduzida"));
        var afterWindow = await RequestVacationStartingAsync(_today.AddDays(DashboardService.AbsenceWindowDays));

        var absences = (await GetDashboardAsync()).Absences;

        absences.Should().ContainSingle(a => a.Id == approved.Id).Which.Status.Should().Be(VacationStatus.Approved);
        absences.Should().ContainSingle(a => a.Id == pending.Id).Which.Status.Should().Be(VacationStatus.Pending);
        absences.Should().NotContain(a => a.Id == rejected.Id || a.Id == afterWindow.Id);
    }

    [Fact]
    public async Task Get_WithAbsence_IncludesEmployeeAndDepartmentNames()
    {
        var department = await TestData.CreateDepartmentAsync(_admin);
        var employee = await TestData.CreateEmployeeAsync(_admin, TestData.NewEmployeeRequest(department.Id));
        var vacation = await RequestVacationAsync(employee.Id, _today.AddDays(2));

        var absence = (await GetDashboardAsync()).Absences.Single(a => a.Id == vacation.Id);

        absence.EmployeeName.Should().Be(employee.Name);
        absence.DepartmentName.Should().Be(department.Name);
    }

    [Fact]
    public async Task Get_WithEmployeeToken_Returns403()
    {
        var employee = await CreateEmployeeAsync();

        var response = await factory.CreateEmployeeClient(employee.Id).GetAsync("/api/dashboard");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private async Task<DashboardResponse> GetDashboardAsync() =>
        (await _admin.GetFromJsonAsync<DashboardResponse>("/api/dashboard", JsonOptions.Default))!;

    private async Task<EmployeeResponse> CreateEmployeeAsync()
    {
        var department = await TestData.CreateDepartmentAsync(_admin);
        return await TestData.CreateEmployeeAsync(_admin, TestData.NewEmployeeRequest(department.Id));
    }

    private async Task<VacationResponse> RequestVacationStartingAsync(DateOnly start)
    {
        var employee = await CreateEmployeeAsync();
        return await RequestVacationAsync(employee.Id, start);
    }

    private Task<VacationResponse> RequestVacationAsync(int employeeId, int daysFromNextMonth) =>
        RequestVacationAsync(employeeId, _nextMonth.AddDays(daysFromNextMonth));

    private async Task<VacationResponse> RequestVacationAsync(int employeeId, DateOnly start)
    {
        var response = await factory.CreateEmployeeClient(employeeId)
            .PostAsJsonAsync("/api/vacations", new CreateVacationRequest(start, start.AddDays(9)));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<VacationResponse>(JsonOptions.Default))!;
    }
}
