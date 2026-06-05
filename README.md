# Atividade Extensionista - PetApp ACAT

Sistema web desenvolvido para apoio ao controle de tutores, animais, clínicas veterinárias, castrações, usuários e registros de auditoria da ACAT, Associação Cuidado Animal de Teutônia.

O projeto foi criado como parte da disciplina de Atividade Extensionista II do curso de Redes de Computadores, com foco em inclusão digital, organização de dados, controle de cadastros e melhoria da gestão das informações relacionadas aos atendimentos e ações de castração.

A aplicação foi desenvolvida com backend em .NET, frontend em React, banco de dados PostgreSQL e execução em containers Docker. O projeto também foi hospedado em uma instância da Oracle Cloud Infrastructure e disponibilizado por meio de endereço DNS público com acesso HTTPS.

## Aplicação hospedada

A aplicação pode ser acessada pelo endereço:

```text
https://acatapp.duckdns.org
```

Para fins de avaliação acadêmica, foi criado um usuário temporário de acesso à aplicação. As credenciais de avaliação foram informadas no documento final entregue à instituição.

## Objetivo do projeto

O PetApp ACAT tem como objetivo permitir o cadastro, consulta, edição e gerenciamento de:

- Tutores
- Animais
- Clínicas veterinárias
- Castrações realizadas ou agendadas
- Usuários do sistema
- Registros de auditoria

O sistema também possui autenticação por login e senha, impedindo acesso não autorizado às telas internas da aplicação.

A solução busca reduzir a dependência de controles manuais, cadernos e planilhas isoladas, proporcionando maior organização, rastreabilidade e segurança no controle das informações utilizadas pela ONG.

## Funcionalidades principais

- Login com autenticação de usuários
- Controle de acesso às telas internas do sistema
- Cadastro, listagem, edição e exclusão de tutores
- Cadastro, listagem, edição e exclusão de animais
- Cadastro, listagem, edição e exclusão de clínicas veterinárias
- Cadastro, listagem, edição e exclusão de procedimentos de castração
- Cadastro e gerenciamento de usuários do sistema
- Ativação e desativação de usuários
- Bloqueio de desativação do único usuário ativo disponível
- Auditoria de ações executadas no sistema
- Interface web para utilização pelos responsáveis pela ONG
- API backend para comunicação com o banco de dados
- Banco de dados relacional em PostgreSQL
- Execução em containers separados para frontend, backend e banco de dados
- Hospedagem em nuvem na Oracle Cloud Infrastructure
- Acesso público por DNS com HTTPS

## Configuração inicial e primeiro acesso

Após clonar o repositório e subir os containers com Docker Compose, o sistema estará disponível na porta `3000`.

Usuário e senha iniciais para ambiente local:

```text
Usuário: admin
Senha: admin
```

Recomenda-se alterar a senha inicial após o primeiro acesso, especialmente em ambientes publicados ou acessíveis pela internet.

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

### Banco de dados

- PostgreSQL
- Entity Framework Core Migrations
- Relacionamento entre entidades
- Tabelas para tutores, animais, clínicas, castrações, usuários e auditoria

### Infraestrutura

- Docker
- Docker Compose
- PostgreSQL em container
- Backend e frontend separados em containers
- Oracle Cloud Infrastructure
- Nginx como proxy reverso
- DNS público via DuckDNS
- HTTPS com certificado TLS

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
```

## Entidades principais do sistema

### Tutor

Armazena os dados dos responsáveis pelos animais.

Exemplos de informações:

- Nome
- Endereço
- Telefone

### Animal

Armazena as informações dos animais cadastrados pela ONG.

Exemplos de informações:

- Nome
- Espécie
- Raça
- Sexo
- Idade
- Peso
- Tutor vinculado
- Situação de castração

### Clínica

Armazena os dados das clínicas veterinárias parceiras ou utilizadas pela ONG.

Exemplos de informações:

- Nome
- Telefone
- Veterinário responsável

### Castração

Armazena os registros de procedimentos de castração realizados ou agendados.

Exemplos de informações:

- Animal vinculado
- Clínica vinculada
- Data da castração
- Valor do procedimento

### Usuário

Armazena os usuários que podem acessar o sistema.

Exemplos de informações:

- Nome de usuário
- Senha protegida
- Situação do usuário
- Permissão de acesso

### Auditoria

Armazena registros das ações realizadas no sistema, contribuindo para rastreabilidade e controle.

Exemplos de informações:

- Usuário responsável pela ação
- Tipo de operação realizada
- Data e horário da ação
- Entidade ou registro afetado

## Como executar o projeto com Docker Compose

### 1. Clonar o repositório

```bash
git clone https://github.com/lsouthier/Atividade-extensionista.git
cd Atividade-extensionista
```

### 2. Subir os containers

```bash
docker compose up -d --build
```

### 3. Verificar os containers em execução

```bash
docker compose ps
```

### 4. Acessar a aplicação localmente

Após subir os containers, a aplicação estará disponível em:

```text
http://localhost:3000
```

## API e documentação Swagger

O backend possui documentação Swagger para testes e validação dos endpoints da API.

Em ambiente local, a documentação pode ser acessada conforme a porta configurada para o backend no `docker-compose.yml`.

Exemplo:

```text
http://localhost:5000/swagger
```

## Implantação em nuvem

Para a entrega acadêmica, a aplicação foi publicada em uma instância da Oracle Cloud Infrastructure.

A infraestrutura utilizada contempla:

- Instância Linux na Oracle Cloud Infrastructure
- Docker e Docker Compose para execução da aplicação
- Container PostgreSQL para banco de dados
- Container backend com API .NET
- Container frontend com React e Nginx
- Nginx como proxy reverso no servidor
- Registro DNS público
- Certificado HTTPS para acesso seguro

A aplicação publicada pode ser acessada em:

```text
https://acatapp.duckdns.org
```

## Segurança e controle de acesso

O sistema possui autenticação por login e senha, impedindo o acesso não autorizado às telas internas da aplicação.

Também foram implementados recursos de controle de usuários e auditoria, permitindo maior rastreabilidade das operações realizadas no sistema.

Principais pontos de segurança aplicados:

- Autenticação com JWT
- Acesso restrito às telas internas
- Usuários controlados pelo sistema
- Possibilidade de ativar ou desativar usuários
- Auditoria de ações relevantes
- Publicação com HTTPS em ambiente hospedado
- Separação dos serviços em containers

## Auditoria

O recurso de auditoria foi implementado para registrar ações executadas no sistema e melhorar a rastreabilidade das informações.

Esse recurso contribui para identificar operações realizadas, auxiliar no acompanhamento das alterações e aumentar a confiabilidade da solução entregue.

## Objetivos de Desenvolvimento Sustentável relacionados

O projeto está relacionado aos seguintes Objetivos de Desenvolvimento Sustentável, considerando o impacto social e organizacional da solução:

- ODS 03, Saúde e bem-estar
- ODS 08, Trabalho decente e crescimento econômico
- ODS 15, Vida terrestre

## Finalidade acadêmica

Este projeto foi desenvolvido para fins acadêmicos, como parte da Atividade Extensionista II, buscando aplicar conhecimentos de tecnologia em uma demanda real da comunidade.

A solução foi direcionada para a Associação Cuidado Animal de Teutônia, com o objetivo de apoiar a organização dos dados utilizados nos processos relacionados aos animais, tutores, clínicas veterinárias e castrações.

## Autor

Leonardo Luís Southier  
RU: 5151840  
Curso: CST em Redes de Computadores  
Centro Universitário Internacional UNINTER
