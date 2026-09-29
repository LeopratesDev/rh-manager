using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using RhManager.Application.Common;
using RhManager.Application.Employees;
using RhManager.Domain.Enums;

namespace RhManager.IntegrationTests;

public class EmployeesEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateAdminClient();

    [Fact]
    public async Task Create_WithValidRequest_Returns201WithLocationAndBody()
    {
        var department = await TestData.CreateDepartmentAsync(_client);
        var request = TestData.NewEmployeeRequest(department.Id) with { Email = $"  {Guid.NewGuid():N}@TESTE.com " };

        var response = await _client.PostAsJsonAsync("/api/employees", request, JsonOptions.Default);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<EmployeeResponse>(JsonOptions.Default);
        response.Headers.Location!.AbsolutePath.Should().Be($"/api/employees/{created!.Id}");
        created.Email.Should().Be(request.Email.Trim().ToLowerInvariant());
        created.Salary.Should().Be(4500.50m);
        created.DepartmentName.Should().Be(department.Name);
    }

    [Fact]
    public async Task Create_WithInvalidCpf_Returns400WithCpfError()
    {
        var department = await TestData.CreateDepartmentAsync(_client);
        var request = TestData.NewEmployeeRequest(department.Id) with { Cpf = "123.456.789-00" };

        var response = await _client.PostAsJsonAsync("/api/employees", request, JsonOptions.Default);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        problem!.Errors.Should().ContainKey("cpf");
    }

    [Fact]
    public async Task Create_WithUnknownDepartment_Returns400WithDepartmentError()
    {
        var response = await _client.PostAsJsonAsync("/api/employees", TestData.NewEmployeeRequest(999999), JsonOptions.Default);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        problem!.Errors.Should().ContainKey("departmentId");
    }

    [Fact]
    public async Task Create_WithDuplicatedEmail_Returns409()
    {
        var department = await TestData.CreateDepartmentAsync(_client);
        var existing = await TestData.CreateEmployeeAsync(_client, TestData.NewEmployeeRequest(department.Id));
        var request = TestData.NewEmployeeRequest(department.Id) with { Email = existing.Email.ToUpperInvariant() };

        var response = await _client.PostAsJsonAsync("/api/employees", request, JsonOptions.Default);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Create_WithDuplicatedCpfInOtherFormat_Returns409()
    {
        var department = await TestData.CreateDepartmentAsync(_client);
        var existing = await TestData.CreateEmployeeAsync(_client, TestData.NewEmployeeRequest(department.Id));
        var formattedCpf = $"{existing.Cpf[..3]}.{existing.Cpf[3..6]}.{existing.Cpf[6..9]}-{existing.Cpf[9..]}";
        var request = TestData.NewEmployeeRequest(department.Id) with { Cpf = formattedCpf };

        var response = await _client.PostAsJsonAsync("/api/employees", request, JsonOptions.Default);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Update_KeepingOwnEmailAndCpf_Returns204()
    {
        var department = await TestData.CreateDepartmentAsync(_client);
        var request = TestData.NewEmployeeRequest(department.Id);
        var employee = await TestData.CreateEmployeeAsync(_client, request);

        var response = await _client.PutAsJsonAsync($"/api/employees/{employee.Id}", request with { Position = "Coordenador" }, JsonOptions.Default);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        var updated = await _client.GetFromJsonAsync<EmployeeResponse>($"/api/employees/{employee.Id}", JsonOptions.Default);
        updated!.Position.Should().Be("Coordenador");
    }

    [Fact]
    public async Task Update_WithUnknownId_Returns404()
    {
        var department = await TestData.CreateDepartmentAsync(_client);

        var response = await _client.PutAsJsonAsync("/api/employees/999999", TestData.NewEmployeeRequest(department.Id), JsonOptions.Default);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Delete_ExistingEmployee_Returns204AndMarksAsInactive()
    {
        var department = await TestData.CreateDepartmentAsync(_client);
        var employee = await TestData.CreateEmployeeAsync(_client, TestData.NewEmployeeRequest(department.Id));

        var response = await _client.DeleteAsync($"/api/employees/{employee.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        var deactivated = await _client.GetFromJsonAsync<EmployeeResponse>($"/api/employees/{employee.Id}", JsonOptions.Default);
        deactivated!.Status.Should().Be(EmployeeStatus.Inactive);
    }

    [Fact]
    public async Task List_WithPageSize_ReturnsRequestedPageAndTotals()
    {
        var department = await TestData.CreateDepartmentAsync(_client);
        for (var i = 0; i < 5; i++)
        {
            await TestData.CreateEmployeeAsync(_client, TestData.NewEmployeeRequest(department.Id));
        }

        var page = await _client.GetFromJsonAsync<PagedResult<EmployeeListItemResponse>>(
            $"/api/employees?departmentId={department.Id}&page=2&pageSize=2", JsonOptions.Default);

        page!.Items.Should().HaveCount(2);
        page.Page.Should().Be(2);
        page.TotalItems.Should().Be(5);
        page.TotalPages.Should().Be(3);
    }

    [Fact]
    public async Task List_WithSearchAndStatusFilters_ReturnsOnlyMatchingEmployees()
    {
        var department = await TestData.CreateDepartmentAsync(_client);
        var marker = Guid.NewGuid().ToString("N")[..8];
        var active = await TestData.CreateEmployeeAsync(_client, TestData.NewEmployeeRequest(department.Id, $"Joana {marker}"));
        var inactive = await TestData.CreateEmployeeAsync(_client, TestData.NewEmployeeRequest(department.Id, $"Pedro {marker}"));
        await TestData.CreateEmployeeAsync(_client, TestData.NewEmployeeRequest(department.Id, "Outra Pessoa"));
        await _client.DeleteAsync($"/api/employees/{inactive.Id}");

        var page = await _client.GetFromJsonAsync<PagedResult<EmployeeListItemResponse>>(
            $"/api/employees?search={marker}&status=Active", JsonOptions.Default);

        page!.Items.Should().ContainSingle().Which.Id.Should().Be(active.Id);
    }

    [Theory]
    [InlineData("page=0")]
    [InlineData("pageSize=51")]
    public async Task List_WithInvalidPagination_Returns400(string queryString)
    {
        var response = await _client.GetAsync($"/api/employees?{queryString}");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task List_NeverExposesSalaryOrFullCpf()
    {
        var department = await TestData.CreateDepartmentAsync(_client);
        var employee = await TestData.CreateEmployeeAsync(_client, TestData.NewEmployeeRequest(department.Id));

        var json = await _client.GetStringAsync($"/api/employees?departmentId={department.Id}");

        json.Should().NotContain("salary").And.NotContain(employee.Cpf);
        json.Should().Contain($"***.{employee.Cpf[3..6]}.{employee.Cpf[6..9]}-**");
    }

    [Fact]
    public async Task GetById_StillReturnsFullCpfAndSalaryForEditing()
    {
        var department = await TestData.CreateDepartmentAsync(_client);
        var request = TestData.NewEmployeeRequest(department.Id);
        var created = await TestData.CreateEmployeeAsync(_client, request);

        var employee = await _client.GetFromJsonAsync<EmployeeResponse>($"/api/employees/{created.Id}", JsonOptions.Default);

        employee!.Cpf.Should().Be(request.Cpf);
        employee.Salary.Should().Be(request.Salary);
    }
}
