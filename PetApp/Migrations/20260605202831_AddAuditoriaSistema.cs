using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PetApp.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditoriaSistema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditoriasSistema",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DataHoraUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsuarioId = table.Column<int>(type: "integer", nullable: true),
                    UsuarioNome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Acao = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Entidade = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntidadeId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ValoresAntes = table.Column<string>(type: "text", nullable: true),
                    ValoresDepois = table.Column<string>(type: "text", nullable: true),
                    IpOrigem = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditoriasSistema", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriasSistema_Acao",
                table: "AuditoriasSistema",
                column: "Acao");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriasSistema_DataHoraUtc",
                table: "AuditoriasSistema",
                column: "DataHoraUtc");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriasSistema_Entidade",
                table: "AuditoriasSistema",
                column: "Entidade");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriasSistema_UsuarioNome",
                table: "AuditoriasSistema",
                column: "UsuarioNome");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditoriasSistema");
        }
    }
}
