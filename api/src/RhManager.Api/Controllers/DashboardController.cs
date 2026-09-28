using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RhManager.Application.Dashboard;
using RhManager.Domain.Enums;

namespace RhManager.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = nameof(UserRole.Admin))]
[Produces("application/json")]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<DashboardResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken) =>
        Ok(await dashboardService.GetAsync(cancellationToken));
}
