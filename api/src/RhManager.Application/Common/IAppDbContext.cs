using Microsoft.EntityFrameworkCore;
using RhManager.Domain.Entities;

namespace RhManager.Application.Common;

public interface IAppDbContext
{
    DbSet<Department> Departments { get; }
    DbSet<Employee> Employees { get; }
    DbSet<User> Users { get; }
    DbSet<VacationRequest> VacationRequests { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
