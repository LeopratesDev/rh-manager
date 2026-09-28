using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using RhManager.Application.Departments;
using RhManager.Application.Employees;

namespace RhManager.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<IEmployeeService, EmployeeService>();

        return services;
    }
}
