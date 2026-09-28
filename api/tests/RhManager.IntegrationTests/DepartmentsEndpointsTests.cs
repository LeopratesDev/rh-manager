using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using RhManager.Application.Departments;

namespace RhManager.IntegrationTests;

public class DepartmentsEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Create_WithValidName_Returns201WithLocationHeader()
    {
        var response = await _client.PostAsJsonAsync("/api/departments", new SaveDepartmentRequest("Marketing"));

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<DepartmentResponse>();
        response.Headers.Location!.AbsolutePath.Should().Be($"/api/departments/{created!.Id}");
    }

    [Fact]
    public async Task Create_WithEmptyName_Returns400WithFieldErrors()
    {
        var response = await _client.PostAsJsonAsync("/api/departments", new SaveDepartmentRequest(""));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        problem!.Errors.Should().ContainKey("name");
    }

    [Fact]
    public async Task Create_WithDuplicatedName_Returns409()
    {
        var existing = await TestData.CreateDepartmentAsync(_client);

        var response = await _client.PostAsJsonAsync("/api/departments", new SaveDepartmentRequest(existing.Name));

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task GetById_WithUnknownId_Returns404()
    {
        var response = await _client.GetAsync("/api/departments/999999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Update_WithNewName_Returns204AndPersistsName()
    {
        var department = await TestData.CreateDepartmentAsync(_client);
        var newName = TestData.UniqueName("Renomeado");

        var response = await _client.PutAsJsonAsync($"/api/departments/{department.Id}", new SaveDepartmentRequest(newName));

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        var updated = await _client.GetFromJsonAsync<DepartmentResponse>($"/api/departments/{department.Id}");
        updated!.Name.Should().Be(newName);
    }

    [Fact]
    public async Task Delete_WithoutEmployees_Returns204()
    {
        var department = await TestData.CreateDepartmentAsync(_client);

        var response = await _client.DeleteAsync($"/api/departments/{department.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await _client.GetAsync($"/api/departments/{department.Id}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Delete_WithEmployees_Returns409()
    {
        var department = await TestData.CreateDepartmentAsync(_client);
        await TestData.CreateEmployeeAsync(_client, TestData.NewEmployeeRequest(department.Id));

        var response = await _client.DeleteAsync($"/api/departments/{department.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }
}
