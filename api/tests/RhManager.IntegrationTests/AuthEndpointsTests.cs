using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using RhManager.Application.Auth;
using RhManager.Domain.Enums;
using RhManager.Infrastructure.Persistence;

namespace RhManager.IntegrationTests;

public class AuthEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _anonymous = factory.CreateClient();

    [Fact]
    public async Task Login_WithDemoAdminCredentials_Returns200WithTokenAndAdminRole()
    {
        var response = await LoginAsync(DatabaseSeeder.DemoAdminEmail, DatabaseSeeder.DemoAdminPassword);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var login = await response.Content.ReadFromJsonAsync<LoginResponse>(JsonOptions.Default);
        login!.AccessToken.Should().NotBeNullOrWhiteSpace();
        login.ExpiresAt.Should().BeAfter(DateTime.UtcNow).And.BeBefore(DateTime.UtcNow.AddMinutes(61));
        login.User.Role.Should().Be(UserRole.Admin);
    }

    [Fact]
    public async Task Login_WithEmailInUpperCase_Returns200()
    {
        var response = await LoginAsync(DatabaseSeeder.DemoEmployeeEmail.ToUpperInvariant(), DatabaseSeeder.DemoEmployeePassword);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Theory]
    [InlineData(DatabaseSeeder.DemoAdminEmail, "senha-errada")]
    [InlineData("ninguem@rhmanager.dev", DatabaseSeeder.DemoAdminPassword)]
    public async Task Login_WithWrongCredentials_Returns401(string email, string password)
    {
        var response = await LoginAsync(email, password);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Login_WithEmptyPassword_Returns400()
    {
        var response = await LoginAsync(DatabaseSeeder.DemoAdminEmail, "");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Me_WithTokenFromLogin_ReturnsLinkedEmployee()
    {
        var login = await (await LoginAsync(DatabaseSeeder.DemoEmployeeEmail, DatabaseSeeder.DemoEmployeePassword))
            .Content.ReadFromJsonAsync<LoginResponse>(JsonOptions.Default);
        _anonymous.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login!.AccessToken);

        var me = await _anonymous.GetFromJsonAsync<UserResponse>("/api/auth/me", JsonOptions.Default);

        me!.Email.Should().Be(DatabaseSeeder.DemoEmployeeEmail);
        me.Role.Should().Be(UserRole.Employee);
        me.EmployeeName.Should().Be("Ana Souza");
    }

    [Fact]
    public async Task Me_WithTamperedToken_Returns401()
    {
        var client = factory.CreateAdminClient();
        var token = client.DefaultRequestHeaders.Authorization!.Parameter!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token[..^2] + "xx");

        var response = await client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task SeededPasswords_AreStoredAsHashes()
    {
        using var scope = factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var hashes = context.Users.Select(u => u.PasswordHash).ToList();

        hashes.Should().NotBeEmpty().And.NotContain([DatabaseSeeder.DemoAdminPassword, DatabaseSeeder.DemoEmployeePassword]);
        hashes.Should().OnlyContain(hash => hash.Length > 50);
    }

    private Task<HttpResponseMessage> LoginAsync(string email, string password) =>
        _anonymous.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
}
