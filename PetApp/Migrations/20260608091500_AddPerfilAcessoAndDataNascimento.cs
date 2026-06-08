using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PetApp.Models;

#nullable disable

namespace PetApp.Migrations
{
    [DbContext(typeof(PetAppContext))]
    [Migration("20260608091500_AddPerfilAcessoAndDataNascimento")]
    public partial class AddPerfilAcessoAndDataNascimento : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataNascimento",
                table: "Animais",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PerfilAcesso",
                table: "UsuariosSistema",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Administrador");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataNascimento",
                table: "Animais");

            migrationBuilder.DropColumn(
                name: "PerfilAcesso",
                table: "UsuariosSistema");
        }
    }
}
