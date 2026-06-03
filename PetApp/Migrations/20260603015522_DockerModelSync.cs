using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetApp.Migrations
{
    /// <inheritdoc />
    public partial class DockerModelSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "CK_Tutores_Nome_NotEmpty",
                table: "Tutores",
                sql: "\"Nome\" IS NOT NULL AND TRIM(\"Nome\") != ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Tutores_Nome_NotEmpty",
                table: "Tutores");
        }
    }
}
