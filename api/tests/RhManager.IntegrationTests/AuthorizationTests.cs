using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using RhManager.Application.Employees;
using RhManager.Application.Vacations;

namespace RhManager.IntegrationTests;

public class AuthorizationTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static readonly DateOnly _nextMonth = DateOnly.FromDateTime(DateTime.Now).AddMonths(1);

    private readonly HttpClient _admin = factory.CreateAdminClient();

    [Theory]
    [InlineData("/api/employees")]
    [InlineData("/api/departments")]
    [InlineData("/api/vacations/mine")]
    [InlineData("/api/auth/me")]
    public async Task Get_WithoutToken_Returns401(string url)
    {
        var response = await factory.CreateClient().GetAsync(url);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("GET", "/api/employees")]
    [InlineData("GET", "/api/departments")]
    [InlineData("GET", "/api/vacations")]
    [InlineData("POST", "/api/vacations/1/approve")]
    public async Task AdminEndpoint_WithEmployeeToken_Returns403(string method, string url)
    {
        var employee = await CreateEmployeeAsync();
        var client = factory.CreateEmployeeClient(employee.Id);

        var response = await client.SendAsync(new HttpRequestMessage(new HttpMethod(method), url));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Reject_WithEmployeeToken_Returns403AndKeepsPending()
    {
        var employee = await CreateEmployeeAsync();
        var client = factory.CreateEmployeeClient(employee.Id);
        var vacation = await CreateVacationAsync(client);

        var response = await client.PostAsJsonAsync($"/api/vacations/{vacation.Id}/reject", new RejectVacationRequest("Auto rejeição"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var current = await _admin.GetFromJsonAsync<VacationResponse>($"/api/vacations/{vacation.Id}", JsonOptions.Default);
        current!.Status.Should().Be(Domain.Enums.VacationStatus.Pending);
    }

    [Fact]
    public async Task GetMyProfile_WithEmployeeToken_ReturnsOwnEmployee()
    {
        var employee = await CreateEmployeeAsync();

        var profile = await factory.CreateEmployeeClient(employee.Id)
            .GetFromJsonAsync<EmployeeResponse>("/api/employees/me", JsonOptions.Default);

        profile!.Id.Should().Be(employee.Id);
    }

    [Fact]
    public async Task ListMine_WithEmployeeToken_ReturnsOnlyOwnRequests()
    {
        var owner = await CreateEmployeeAsync();
        var other = await CreateEmployeeAsync();
        var ownVacation = await CreateVacationAsync(factory.CreateEmployeeClient(owner.Id));
        await CreateVacationAsync(factory.CreateEmployeeClient(other.Id));

        var mine = await factory.CreateEmployeeClient(owner.Id)
            .GetFromJsonAsync<List<VacationResponse>>("/api/vacations/mine", JsonOptions.Default);

        mine.Should().ContainSingle().Which.Id.Should().Be(ownVacation.Id);
    }

    [Fact]
    public async Task GetVacationById_OfAnotherEmployee_Returns403()
    {
        var owner = await CreateEmployeeAsync();
        var intruder = await CreateEmployeeAsync();
        var vacation = await CreateVacationAsync(factory.CreateEmployeeClient(owner.Id));

        var response = await factory.CreateEmployeeClient(intruder.Id).GetAsync($"/api/vacations/{vacation.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateVacation_WithAdminWithoutEmployee_Returns403()
    {
        var response = await _admin.PostAsJsonAsync("/api/vacations", new CreateVacationRequest(_nextMonth, _nextMonth.AddDays(9)));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private async Task<EmployeeResponse> CreateEmployeeAsync()
    {
        var department = await TestData.CreateDepartmentAsync(_admin);
        return await TestData.CreateEmployeeAsync(_admin, TestData.NewEmployeeRequest(department.Id));
    }

    private static async Task<VacationResponse> CreateVacationAsync(HttpClient employeeClient)
    {
        var response = await employeeClient.PostAsJsonAsync("/api/vacations", new CreateVacationRequest(_nextMonth, _nextMonth.AddDays(9)));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<VacationResponse>(JsonOptions.Default))!;
    }
}
