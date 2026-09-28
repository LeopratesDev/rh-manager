using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RhManager.Domain.Entities;

namespace RhManager.Infrastructure.Persistence.Configurations;

public class VacationRequestConfiguration : IEntityTypeConfiguration<VacationRequest>
{
    public void Configure(EntityTypeBuilder<VacationRequest> builder)
    {
        builder.Property(v => v.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(v => v.RejectionReason).HasMaxLength(500);

        builder.HasIndex(v => new { v.EmployeeId, v.Status });

        builder.HasOne(v => v.Employee)
            .WithMany(e => e.VacationRequests)
            .HasForeignKey(v => v.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
