# PetApp ACAT

**Versão atual:** 1.6.9

Sistema web desenvolvido para apoio ao controle de pets, tutores, clínicas veterinárias, castrações, usuários e registros de auditoria da ACAT, Associação Cuidado Animal de Teutônia.

O projeto foi desenvolvido como parte da disciplina de Atividade Extensionista II do curso de Redes de Computadores, com foco em inclusão digital, organização de dados, rastreabilidade e melhoria da gestão das informações utilizadas pela ONG.

A aplicação utiliza backend em .NET, frontend em React, banco de dados PostgreSQL e execução em containers Docker.

---

## Aplicação hospedada

A aplicação pode ser acessada em:

```text
https://acatapp.duckdns.org
```

Para fins de avaliação acadêmica, foi criado um usuário temporário de acesso à aplicação. As credenciais foram informadas no documento final entregue à instituição.

---

## Objetivo

O PetApp ACAT tem como objetivo centralizar e organizar o controle de:

- Pets
- Tutores
- Clínicas veterinárias
- Castrações realizadas ou agendadas
- Usuários do sistema
- Perfis de acesso
- Auditoria das operações

A solução reduz a dependência de controles manuais, cadernos e planilhas isoladas, proporcionando maior segurança, rastreabilidade e confiabilidade na gestão das informações.

---

## Funcionalidades principais

- Login com autenticação JWT.
- Controle de acesso por perfil de usuário.
- Perfis: Leitura, Cadastro e Administrador.
- Cadastro, edição, exclusão, pesquisa, filtros e ordenação.
- Gestão de pets com data de nascimento e idade calculada.
- Cadastro de tutores com consulta automática de CEP.
- Endereço estruturado com CEP, rua, número, bairro, cidade e UF.
- Telefone obrigatório para tutores.
- Cadastro de clínicas veterinárias.
- Registro de castrações realizadas ou agendadas.
- Atualização automática do status de castração quando a data programada é atingida.
- Auditoria de ações realizadas no sistema.
- Invalidação automática da sessão quando o usuário logado é alterado.
- Interface responsiva.
- Rodapé com versão do sistema.

---

## Perfis de acesso

### Leitura

- Visualiza os cadastros.
- Não pode criar, editar ou excluir registros.
- Não possui acesso às telas de usuários e auditoria.

### Cadastro

- Pode criar, editar e excluir pets, tutores, clínicas e castrações.
- Não possui acesso às telas de usuários e auditoria.

### Administrador

- Possui acesso completo ao sistema.
- Pode gerenciar usuários, perfis de acesso e auditoria.
- O sistema impede a remoção ou desativação do último administrador ativo.

---

## Regras importantes

- Pets podem ser cadastrados com espécie Felina, Canina ou Outros.
- A idade do pet é calculada automaticamente pela data de nascimento.
- A castração futura não marca o pet como castrado imediatamente.
- Quando a data da castração chega, o sistema marca automaticamente o pet como castrado.
- Se uma castração já realizada for excluída, o pet continua marcado como castrado.
- Se uma clínica possuir castrações vinculadas, a exclusão exige confirmação.
- Se um tutor possuir pets vinculados, a exclusão exige confirmação.
- Senhas de usuários devem ter no mínimo 6 caracteres, com letra maiúscula, letra minúscula, número e caractere especial.

---

## Tecnologias utilizadas

### Backend

- .NET
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- JWT
- BackgroundService
- Swagger

### Frontend

- React
- TypeScript
- Redux Toolkit
- Axios
- Bootstrap
- Vite
- Nginx

### Infraestrutura

- Docker
- Docker Compose
- PostgreSQL em container
- Backend e frontend em containers separados
- Oracle Cloud Infrastructure
- DuckDNS
- HTTPS

---

## Estrutura do projeto

```text
.
├── PetApp/
│   ├── Controllers/
│   ├── Migrations/
│   ├── Models/
│   │   └── Dtos/
│   ├── Services/
│   ├── Views/
│   │   └── src/
│   │       ├── api/
│   │       ├── assets/
│   │       ├── components/
│   │       ├── store/
│   │       ├── styles/
│   │       ├── App.tsx
│   │       ├── appVersion.ts
│   │       └── main.tsx
│   ├── Program.cs
│   ├── PetApp.csproj
│   ├── appsettings.json
│   └── appsettings.Production.json
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
├── nginx.conf
├── nuget.config
├── VERSION
├── set-version.sh
└── README.md
```

---

## Como executar com Docker Compose

### 1. Clonar o repositório

```bash
git clone https://github.com/lsouthier/Atividade-extensionista.git
cd Atividade-extensionista
```

### 2. Subir os containers

```bash
docker compose up -d --build
```

### 3. Verificar os containers

```bash
docker compose ps
```

### 4. Acessar localmente

```text
http://localhost:3000
```

---

## Primeiro acesso

Usuário inicial para ambiente local:

```text
Usuário: admin
Senha: admin
```

O usuário inicial é criado automaticamente com perfil de Administrador quando o banco é inicializado vazio.

Recomenda-se alterar a senha após o primeiro acesso.

---

## API e Swagger

Em ambiente local, a documentação da API pode ser acessada em:

```text
http://localhost:5000/swagger
```

---

## Versionamento

A versão do sistema é exibida no rodapé da aplicação e controlada pelos arquivos:

```text
VERSION
PetApp/Views/src/appVersion.ts
```

Para atualizar a versão:

```bash
./set-version.sh 1.6.6
docker compose up -d --build frontend
```

O projeto utiliza o formato:

```text
MAJOR.MINOR.PATCH
```

Exemplo:

```text
1.6.5
```

---

## Segurança

Principais recursos aplicados:

- Autenticação com JWT.
- Controle de acesso por perfil.
- Senhas armazenadas com hash.
- Política mínima de senha forte.
- Bloqueio contra remoção do último administrador ativo.
- Auditoria de ações relevantes.
- Invalidação automática de sessão após alteração do usuário logado.
- HTTPS no ambiente publicado.
- Serviços separados em containers.

---

## Objetivos de Desenvolvimento Sustentável relacionados

O projeto está relacionado aos seguintes ODS:

- ODS 03, Saúde e bem-estar
- ODS 08, Trabalho decente e crescimento econômico
- ODS 15, Vida terrestre

---

## Finalidade acadêmica

Este projeto foi desenvolvido para fins acadêmicos, como parte da Atividade Extensionista II, buscando aplicar conhecimentos de tecnologia em uma demanda real da comunidade.

A solução foi direcionada para a Associação Cuidado Animal de Teutônia, com o objetivo de apoiar a organização dos dados utilizados nos processos relacionados a pets, tutores, clínicas veterinárias e castrações.

---

## Autor

Leonardo Luís Southier  
RU: 5151840  
Curso: CST em Redes de Computadores  
Centro Universitário Internacional UNINTER
