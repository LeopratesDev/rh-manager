using FluentAssertions;

namespace RhManager.IntegrationTests;

public class CorsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Preflight_FromConfiguredFrontEndOrigin_AllowsOrigin()
    {
        var response = await SendPreflightAsync("http://localhost:5173");

        response.Headers.GetValues("Access-Control-Allow-Origin").Should().ContainSingle("http://localhost:5173");
    }

    [Fact]
    public async Task Preflight_FromUnknownOrigin_DoesNotAllowOrigin()
    {
        var response = await SendPreflightAsync("https://site-malicioso.com");

        response.Headers.Contains("Access-Control-Allow-Origin").Should().BeFalse();
    }

    private Task<HttpResponseMessage> SendPreflightAsync(string origin)
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/employees");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "GET");
        request.Headers.Add("Access-Control-Request-Headers", "authorization");
        return factory.CreateClient().SendAsync(request);
    }
}
