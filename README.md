# Atividade Extensionista - PetApp ACAT

Sistema web desenvolvido para apoio ao controle de tutores, animais, clínicas e castrações da ACAT, Associação Cuidado Animal de Teutônia.

O projeto foi criado como parte de uma atividade extensionista, com foco em organização de dados, controle de cadastros e melhoria da gestão das informações relacionadas aos atendimentos e ações de castração.

## Objetivo do projeto

O PetApp ACAT tem como objetivo permitir o cadastro e gerenciamento de:

- Tutores
- Animais
- Clínicas veterinárias
- Castrações realizadas ou agendadas
- Usuários do sistema

O sistema também possui autenticação por login e senha, impedindo acesso não autorizado às telas internas da aplicação.

## Configuração inicial e primeiro acesso

Após clonar o repositório e subir os containers com Docker Compose, o sistema estará disponível na porta `3000`.
Usuário e senha iniciais: admin/admin

## Tecnologias utilizadas

### Backend

- .NET
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- Autenticação JWT
- Swagger para documentação e testes da API

### Frontend

- React
- TypeScript
- Redux Toolkit
- Axios
- Bootstrap
- Vite
- Nginx para servir o frontend em produção

### Infraestrutura

- Docker
- Docker Compose
- PostgreSQL em container
- Backend e frontend separados em containers

## Estrutura do projeto

```text
.
├── PetApp/
│   ├── Controllers/
│   ├── Migrations/
│   ├── Models/
│   ├── Properties/
│   ├── Views/
│   │   └── src/
│   │       ├── api/
│   │       ├── assets/
│   │       ├── components/
│   │       ├── store/
│   │       └── styles/
│   ├── Program.cs
│   ├── PetApp.csproj
│   ├── appsettings.json
│   └── appsettings.Production.json
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
├── nginx.conf
├── nuget.config
└── README.md
