using Microsoft.AspNetCore.Mvc;
using RhManager.Application.Auth;
using RhManager.Application.Employees;

namespace RhManager.Api.Controllers;

[ApiController]
[Route("api/employees/me")]
[Produces("application/json")]
public class ProfileController(IEmployeeService employeeService, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<EmployeeResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        if (currentUser.EmployeeId is null)
        {
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Recurso não encontrado",
                detail: "Seu usuário não está vinculado a um funcionário.");
        }

        return Ok(await employeeService.GetByIdAsync(currentUser.EmployeeId.Value, cancellationToken));
    }
}
