using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetApp.Migrations
{
    /// <inheritdoc />
    public partial class RestrictTutorDeleteAndFixScheduledCastration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Animais_Tutores_IdTutor",
                table: "Animais");

            migrationBuilder.AddForeignKey(
                name: "FK_Animais_Tutores_IdTutor",
                table: "Animais",
                column: "IdTutor",
                principalTable: "Tutores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Animais_Tutores_IdTutor",
                table: "Animais");

            migrationBuilder.AddForeignKey(
                name: "FK_Animais_Tutores_IdTutor",
                table: "Animais",
                column: "IdTutor",
                principalTable: "Tutores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
