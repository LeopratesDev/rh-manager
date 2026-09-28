using Microsoft.AspNetCore.Mvc;
using RhManager.Application.Vacations;
using RhManager.Domain.Enums;

namespace RhManager.Api.Controllers;

[ApiController]
[Route("api/vacations")]
[Produces("application/json")]
public class VacationsController(IVacationService vacationService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<VacationResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] VacationStatus? status, [FromQuery] int? employeeId, CancellationToken cancellationToken) =>
        Ok(await vacationService.ListAsync(status, employeeId, cancellationToken));

    [HttpGet("{id:int}")]
    [ProducesResponseType<VacationResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await vacationService.GetByIdAsync(id, cancellationToken));

    [HttpPost]
    [ProducesResponseType<VacationResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(CreateVacationRequest request, CancellationToken cancellationToken)
    {
        var vacation = await vacationService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = vacation.Id }, vacation);
    }

    [HttpPost("{id:int}/approve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Approve(int id, CancellationToken cancellationToken)
    {
        await vacationService.ApproveAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:int}/reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Reject(int id, RejectVacationRequest request, CancellationToken cancellationToken)
    {
        await vacationService.RejectAsync(id, request, cancellationToken);
        return NoContent();
    }
}
