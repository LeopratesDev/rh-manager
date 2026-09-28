using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RhManager.Application.Auth;
using RhManager.Domain.Entities;
using RhManager.Domain.Enums;

namespace RhManager.Infrastructure.Persistence;

public class DatabaseSeeder(AppDbContext context, IPasswordHasher passwordHasher, ILogger<DatabaseSeeder> logger)
{
    public const string DemoAdminEmail = "admin@rhmanager.dev";
    public const string DemoAdminPassword = "Admin@123";
    public const string DemoEmployeeEmail = "ana.souza@rhmanager.dev";
    public const string DemoEmployeePassword = "Colab@123";

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await SeedEmployeesAsync(cancellationToken);
        await SeedUsersAsync(cancellationToken);
    }

    private async Task SeedEmployeesAsync(CancellationToken cancellationToken)
    {
        if (await context.Departments.AnyAsync(cancellationToken))
        {
            logger.LogInformation("Departments and employees already seeded, skipping");
            return;
        }

        var technology = new Department { Name = "Tecnologia" };
        var people = new Department { Name = "Recursos Humanos" };
        var finance = new Department { Name = "Financeiro" };

        context.Departments.AddRange(technology, people, finance);
        context.Employees.AddRange(CreateEmployees(technology, people, finance));
        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Database seeded with demo departments and employees");
    }

    private async Task SeedUsersAsync(CancellationToken cancellationToken)
    {
        if (await context.Users.AnyAsync(cancellationToken))
        {
            logger.LogInformation("Users already seeded, skipping");
            return;
        }

        var demoEmployee = await context.Employees.SingleAsync(e => e.Email == DemoEmployeeEmail, cancellationToken);

        context.Users.AddRange(
            new User { Email = DemoAdminEmail, PasswordHash = passwordHasher.Hash(DemoAdminPassword), Role = UserRole.Admin },
            new User { Email = DemoEmployeeEmail, PasswordHash = passwordHasher.Hash(DemoEmployeePassword), Role = UserRole.Employee, EmployeeId = demoEmployee.Id });
        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Database seeded with demo admin and employee users");
    }

    private static List<Employee> CreateEmployees(Department technology, Department people, Department finance) =>
    [
        NewEmployee("Ana Souza", "52601815906", "Desenvolvedora Back-end", 7500m, new DateOnly(2021, 3, 1), technology),
        NewEmployee("Bruno Lima", "08301661305", "Desenvolvedor Front-end", 6800m, new DateOnly(2022, 6, 15), technology),
        NewEmployee("Carla Mendes", "18609139034", "Tech Lead", 14500m, new DateOnly(2019, 1, 10), technology),
        NewEmployee("Diego Rocha", "99603082430", "Analista de QA", 5900m, new DateOnly(2023, 2, 20), technology),
        NewEmployee("Elisa Ferreira", "62819482112", "Engenheira de Dados", 9800m, new DateOnly(2020, 9, 7), technology),
        NewEmployee("Fábio Costa", "99351819019", "Desenvolvedor Júnior", 4200m, new DateOnly(2025, 11, 3), technology),
        NewEmployee("Gabriela Alves", "93786579741", "DevOps", 11200m, new DateOnly(2021, 8, 23), technology),
        NewEmployee("Henrique Dias", "54323194897", "Analista de Suporte", 3900m, new DateOnly(2024, 4, 1), technology, EmployeeStatus.Inactive),
        NewEmployee("Isabela Martins", "75749118606", "Gerente de RH", 12000m, new DateOnly(2018, 5, 14), people),
        NewEmployee("João Pereira", "25276018987", "Analista de RH", 5600m, new DateOnly(2022, 1, 17), people),
        NewEmployee("Karina Barbosa", "55597971115", "Recrutadora", 5200m, new DateOnly(2023, 7, 3), people),
        NewEmployee("Lucas Ribeiro", "47104974601", "Analista de Departamento Pessoal", 5400m, new DateOnly(2020, 11, 30), people),
        NewEmployee("Mariana Gomes", "50752917080", "Assistente de RH", 3500m, new DateOnly(2026, 2, 2), people),
        NewEmployee("Nicolas Cardoso", "34236671255", "Business Partner", 8900m, new DateOnly(2021, 10, 11), people, EmployeeStatus.Inactive),
        NewEmployee("Olivia Teixeira", "76842684650", "Gerente Financeira", 13500m, new DateOnly(2017, 4, 3), finance),
        NewEmployee("Paulo Nunes", "56321223360", "Analista Financeiro", 6200m, new DateOnly(2022, 3, 28), finance),
        NewEmployee("Rafaela Castro", "07924402691", "Analista Contábil", 5800m, new DateOnly(2021, 6, 21), finance),
        NewEmployee("Samuel Moreira", "85995289047", "Assistente Financeiro", 3700m, new DateOnly(2024, 9, 16), finance),
        NewEmployee("Tatiane Araújo", "78666617667", "Controller", 10500m, new DateOnly(2019, 12, 2), finance),
        NewEmployee("Vinícius Freitas", "03137215994", "Analista de Custos", 6100m, new DateOnly(2023, 10, 9), finance)
    ];

    private static Employee NewEmployee(
        string name, string cpf, string position, decimal salary, DateOnly hireDate,
        Department department, EmployeeStatus status = EmployeeStatus.Active) => new()
        {
            Name = name,
            Email = ToEmail(name),
            Cpf = cpf,
            Position = position,
            Salary = salary,
            HireDate = hireDate,
            Department = department,
            Status = status
        };

    private static string ToEmail(string name)
    {
        var withoutAccents = new string(name.Normalize(NormalizationForm.FormD)
            .Where(c => char.IsAsciiLetter(c) || c == ' ')
            .ToArray());

        return $"{withoutAccents.ToLowerInvariant().Replace(' ', '.')}@rhmanager.dev";
    }
}
