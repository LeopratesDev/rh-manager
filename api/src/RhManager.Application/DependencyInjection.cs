using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using RhManager.Application.Departments;
using RhManager.Application.Employees;
using RhManager.Application.Vacations;

namespace RhManager.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<IVacationService, VacationService>();
        services.AddSingleton(TimeProvider.System);

        return services;
    }
}
