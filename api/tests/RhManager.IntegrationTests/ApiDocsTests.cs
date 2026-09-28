using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;

namespace RhManager.IntegrationTests;

public class ApiDocsTests
{
    [Theory]
    [InlineData("/openapi/v1.json")]
    [InlineData("/scalar/v1")]
    public async Task Get_WhenApiDocsDisabled_Returns404(string url)
    {
        using var factory = new ApiFactory();

        var response = await factory.CreateClient().GetAsync(url);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Theory]
    [InlineData("/openapi/v1.json")]
    [InlineData("/scalar/v1")]
    public async Task Get_WhenApiDocsEnabled_Returns200(string url)
    {
        using var factory = new ApiFactory().WithWebHostBuilder(builder => builder.UseSetting("ApiDocs:Enabled", "true"));

        var response = await factory.CreateClient().GetAsync(url);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
