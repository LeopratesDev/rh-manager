using System.Net.Http.Headers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using RhManager.Application.Auth;
using RhManager.Domain.Entities;
using RhManager.Domain.Enums;
using RhManager.Infrastructure.Persistence;

namespace RhManager.IntegrationTests;

public class ApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Default", "Server=unused;Database=unused");
        builder.UseSetting("Jwt:Key", "integration-tests-signing-key-with-at-least-32-chars");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.RemoveAll<DbContextOptions<AppDbContext>>();

            _connection.Open();
            services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        using var scope = host.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.EnsureCreated();
        scope.ServiceProvider.GetRequiredService<DatabaseSeeder>().SeedAsync().GetAwaiter().GetResult();

        return host;
    }

    public HttpClient CreateAdminClient() =>
        CreateClientFor(context => context.Users.Single(u => u.Role == UserRole.Admin));

    public HttpClient CreateEmployeeClient(int employeeId) =>
        CreateClientFor(context =>
        {
            var user = context.Users.SingleOrDefault(u => u.EmployeeId == employeeId);
            if (user is null)
            {
                user = new User { Email = $"user{employeeId}@teste.com", PasswordHash = "not-used", Role = UserRole.Employee, EmployeeId = employeeId };
                context.Users.Add(user);
                context.SaveChanges();
            }

            return user;
        });

    private HttpClient CreateClientFor(Func<AppDbContext, User> findUser)
    {
        using var scope = Services.CreateScope();
        var user = findUser(scope.ServiceProvider.GetRequiredService<AppDbContext>());
        var token = scope.ServiceProvider.GetRequiredService<ITokenService>().CreateToken(user);

        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.Token);
        return client;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        _connection.Dispose();
    }
}
