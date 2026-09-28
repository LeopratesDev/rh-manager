using System.Net;
using FluentAssertions;

namespace RhManager.IntegrationTests;

public class HealthCheckTests(ApiFactory factory)
    : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task GetHealth_WhenApiIsRunning_ReturnsOkWithHealthyStatus()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync()).Should().Be("Healthy");
    }
}
