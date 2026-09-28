using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RhManager.Domain.Entities;

namespace RhManager.Infrastructure.Persistence.Configurations;

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.Property(e => e.Name).HasMaxLength(150).IsRequired();
        builder.Property(e => e.Email).HasMaxLength(254).IsRequired();
        builder.Property(e => e.Cpf).HasMaxLength(11).IsFixedLength().IsRequired();
        builder.Property(e => e.Position).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Salary).HasPrecision(18, 2);
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(e => e.Email).IsUnique();
        builder.HasIndex(e => e.Cpf).IsUnique();

        builder.HasOne(e => e.Department)
            .WithMany(d => d.Employees)
            .HasForeignKey(e => e.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
