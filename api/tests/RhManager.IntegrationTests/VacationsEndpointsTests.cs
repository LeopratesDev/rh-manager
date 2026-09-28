using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using RhManager.Application.Employees;
using RhManager.Application.Vacations;
using RhManager.Domain.Enums;

namespace RhManager.IntegrationTests;

public class VacationsEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static readonly DateOnly _today = DateOnly.FromDateTime(DateTime.Now);
    private static readonly DateOnly _nextMonth = _today.AddMonths(1);

    private readonly HttpClient _client = factory.CreateAdminClient();

    [Fact]
    public async Task Create_WithValidPeriod_Returns201AsPending()
    {
        var employee = await CreateEmployeeAsync();

        var response = await PostVacationAsync(employee.Id, _nextMonth, _nextMonth.AddDays(9));

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var vacation = await response.Content.ReadFromJsonAsync<VacationResponse>(JsonOptions.Default);
        response.Headers.Location!.AbsolutePath.Should().Be($"/api/vacations/{vacation!.Id}");
        vacation.Status.Should().Be(VacationStatus.Pending);
        vacation.Days.Should().Be(10);
    }

    [Fact]
    public async Task Create_WithFourDays_Returns400()
    {
        var employee = await CreateEmployeeAsync();

        var response = await PostVacationAsync(employee.Id, _nextMonth, _nextMonth.AddDays(3));

        await ShouldBeValidationErrorAsync(response, "entre 5 e 30 dias");
    }

    [Fact]
    public async Task Create_StartingInThePast_Returns400()
    {
        var employee = await CreateEmployeeAsync();

        var response = await PostVacationAsync(employee.Id, _today.AddDays(-1), _today.AddDays(8));

        await ShouldBeValidationErrorAsync(response, "passado");
    }

    [Fact]
    public async Task Create_ForEmployeeWithLessThanTwelveMonths_Returns400()
    {
        var employee = await CreateEmployeeAsync(hireDate: _today.AddMonths(-11));

        var response = await PostVacationAsync(employee.Id, _nextMonth, _nextMonth.AddDays(9));

        await ShouldBeValidationErrorAsync(response, "12 meses");
    }

    [Theory]
    [InlineData(VacationStatus.Pending)]
    [InlineData(VacationStatus.Approved)]
    public async Task Create_OverlappingActiveRequest_Returns409(VacationStatus existingStatus)
    {
        var employee = await CreateEmployeeAsync();
        var existing = await CreateVacationAsync(employee.Id, _nextMonth, _nextMonth.AddDays(9));
        if (existingStatus == VacationStatus.Approved)
        {
            await _client.PostAsync($"/api/vacations/{existing.Id}/approve", null);
        }

        var response = await PostVacationAsync(employee.Id, _nextMonth.AddDays(9), _nextMonth.AddDays(15));

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Theory]
    [InlineData(-5, 0)]
    [InlineData(9, 15)]
    public async Task Create_SharingOnlyOneBoundaryDay_Returns409(int startOffset, int endOffset)
    {
        var employee = await CreateEmployeeAsync();
        await CreateVacationAsync(employee.Id, _nextMonth, _nextMonth.AddDays(9));

        var response = await PostVacationAsync(employee.Id, _nextMonth.AddDays(startOffset), _nextMonth.AddDays(endOffset));

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Create_OverlappingRejectedRequest_Returns201()
    {
        var employee = await CreateEmployeeAsync();
        var rejected = await CreateVacationAsync(employee.Id, _nextMonth, _nextMonth.AddDays(9));
        await _client.PostAsJsonAsync($"/api/vacations/{rejected.Id}/reject", new RejectVacationRequest("Fechamento do trimestre"));

        var response = await PostVacationAsync(employee.Id, _nextMonth, _nextMonth.AddDays(9));

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Create_AdjacentToExistingRequest_Returns201()
    {
        var employee = await CreateEmployeeAsync();
        await CreateVacationAsync(employee.Id, _nextMonth, _nextMonth.AddDays(9));

        var response = await PostVacationAsync(employee.Id, _nextMonth.AddDays(10), _nextMonth.AddDays(14));

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Approve_PendingRequest_Returns204AndMarksApproved()
    {
        var employee = await CreateEmployeeAsync();
        var vacation = await CreateVacationAsync(employee.Id, _nextMonth, _nextMonth.AddDays(9));

        var response = await _client.PostAsync($"/api/vacations/{vacation.Id}/approve", null);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        var approved = await GetVacationAsync(vacation.Id);
        approved.Status.Should().Be(VacationStatus.Approved);
        approved.ReviewedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Approve_AlreadyApprovedRequest_Returns409()
    {
        var employee = await CreateEmployeeAsync();
        var vacation = await CreateVacationAsync(employee.Id, _nextMonth, _nextMonth.AddDays(9));
        await _client.PostAsync($"/api/vacations/{vacation.Id}/approve", null);

        var response = await _client.PostAsync($"/api/vacations/{vacation.Id}/approve", null);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Approve_UnknownRequest_Returns404()
    {
        var response = await _client.PostAsync("/api/vacations/999999/approve", null);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Reject_WithReason_Returns204AndStoresReason()
    {
        var employee = await CreateEmployeeAsync();
        var vacation = await CreateVacationAsync(employee.Id, _nextMonth, _nextMonth.AddDays(9));

        var response = await _client.PostAsJsonAsync($"/api/vacations/{vacation.Id}/reject", new RejectVacationRequest("Fechamento do trimestre"));

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        var rejected = await GetVacationAsync(vacation.Id);
        rejected.Status.Should().Be(VacationStatus.Rejected);
        rejected.RejectionReason.Should().Be("Fechamento do trimestre");
    }

    [Fact]
    public async Task Reject_WithoutReason_Returns400AndKeepsPending()
    {
        var employee = await CreateEmployeeAsync();
        var vacation = await CreateVacationAsync(employee.Id, _nextMonth, _nextMonth.AddDays(9));

        var response = await _client.PostAsJsonAsync($"/api/vacations/{vacation.Id}/reject", new RejectVacationRequest(""));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await GetVacationAsync(vacation.Id)).Status.Should().Be(VacationStatus.Pending);
    }

    [Fact]
    public async Task List_FilteredByStatusAndEmployee_ReturnsOnlyMatchingRequests()
    {
        var employee = await CreateEmployeeAsync();
        var pending = await CreateVacationAsync(employee.Id, _nextMonth, _nextMonth.AddDays(9));
        var toApprove = await CreateVacationAsync(employee.Id, _nextMonth.AddDays(30), _nextMonth.AddDays(39));
        await _client.PostAsync($"/api/vacations/{toApprove.Id}/approve", null);

        var result = await _client.GetFromJsonAsync<List<VacationResponse>>(
            $"/api/vacations?status=Pending&employeeId={employee.Id}", JsonOptions.Default);

        result.Should().ContainSingle().Which.Id.Should().Be(pending.Id);
    }

    private async Task<EmployeeResponse> CreateEmployeeAsync(DateOnly? hireDate = null)
    {
        var department = await TestData.CreateDepartmentAsync(_client);
        var request = TestData.NewEmployeeRequest(department.Id);
        if (hireDate is not null)
        {
            request = request with { HireDate = hireDate.Value };
        }

        return await TestData.CreateEmployeeAsync(_client, request);
    }

    private Task<HttpResponseMessage> PostVacationAsync(int employeeId, DateOnly start, DateOnly end) =>
        factory.CreateEmployeeClient(employeeId).PostAsJsonAsync("/api/vacations", new CreateVacationRequest(start, end));

    private async Task<VacationResponse> CreateVacationAsync(int employeeId, DateOnly start, DateOnly end)
    {
        var response = await PostVacationAsync(employeeId, start, end);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<VacationResponse>(JsonOptions.Default))!;
    }

    private async Task<VacationResponse> GetVacationAsync(int id) =>
        (await _client.GetFromJsonAsync<VacationResponse>($"/api/vacations/{id}", JsonOptions.Default))!;

    private static async Task ShouldBeValidationErrorAsync(HttpResponseMessage response, string expectedMessagePart)
    {
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        problem!.Errors["period"].Should().ContainSingle().Which.Should().Contain(expectedMessagePart);
    }
}
