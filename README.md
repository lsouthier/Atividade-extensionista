# PetApp ACAT

**Versão atual:** 1.4.16

Sistema web desenvolvido para apoio ao controle de tutores, animais, clínicas veterinárias, castrações, usuários e registros de auditoria da ACAT, Associação Cuidado Animal de Teutônia.

O projeto foi criado como parte da disciplina de Atividade Extensionista II do curso de Redes de Computadores, com foco em inclusão digital, organização de dados, controle de cadastros, rastreabilidade e melhoria da gestão das informações relacionadas aos atendimentos e ações de castração.

A aplicação foi desenvolvida com backend em .NET, frontend em React, banco de dados PostgreSQL e execução em containers Docker. O projeto também foi hospedado em uma instância da Oracle Cloud Infrastructure e disponibilizado por meio de endereço DNS público com acesso HTTPS.

---

## Aplicação hospedada

A aplicação pode ser acessada pelo endereço:

```text
https://acatapp.duckdns.org
```

Para fins de avaliação acadêmica, foi criado um usuário temporário de acesso à aplicação. As credenciais de avaliação foram informadas no documento final entregue à instituição.

---

## Objetivo do projeto

O PetApp ACAT tem como objetivo permitir o cadastro, consulta, edição, gerenciamento e rastreabilidade de:

- Tutores
- Animais
- Clínicas veterinárias
- Castrações realizadas ou agendadas
- Usuários do sistema
- Perfis de acesso
- Registros de auditoria

A solução busca reduzir a dependência de controles manuais, cadernos e planilhas isoladas, proporcionando maior organização, rastreabilidade, segurança e confiabilidade no controle das informações utilizadas pela ONG.

---

## Funcionalidades principais

### Autenticação e acesso

- Login com autenticação de usuários.
- Autenticação baseada em JWT.
- Controle de acesso por perfil de usuário.
- Sessão com expiração automática.
- Invalidação automática da sessão quando o próprio usuário logado é alterado.
- Logout automático quando nome, senha, status ou perfil do usuário logado é modificado.
- Proteção de rotas no backend por políticas de autorização.
- Ocultação e bloqueio de recursos no frontend conforme o perfil do usuário.

### Perfis de usuário

O sistema possui três tipos de perfil:

#### Leitura

- Acesso somente leitura ao sistema.
- Pode visualizar animais, tutores, clínicas e castrações.
- Não pode criar, editar ou excluir registros.
- Botões de novo, editar e excluir ficam desabilitados visualmente.
- Não possui acesso à tela de usuários.
- Não possui acesso à tela de auditoria.
- Tentativas de alteração via API são bloqueadas pelo backend.

#### Cadastro

- Pode visualizar, cadastrar, editar e excluir animais, tutores, clínicas e castrações.
- Não possui acesso à tela de usuários.
- Não possui acesso à tela de auditoria.
- Tentativas de acesso administrativo via API são bloqueadas pelo backend.

#### Administrador

- Acesso completo ao sistema.
- Pode gerenciar animais, tutores, clínicas, castrações, usuários e auditoria.
- Pode criar, editar, ativar, desativar e excluir usuários.
- Pode alterar o tipo de usuário.
- Pode visualizar os registros de auditoria.
- O sistema impede que o último administrador ativo seja removido, desativado ou alterado para outro perfil.

### Cadastros e gestão de dados

- Cadastro, listagem, edição e exclusão de tutores.
- Cadastro, listagem, edição e exclusão de animais.
- Cadastro, listagem, edição e exclusão de clínicas veterinárias.
- Cadastro, listagem, edição e exclusão de procedimentos de castração.
- Cadastro e gerenciamento de usuários do sistema.
- Ativação e desativação de usuários.
- Alteração de perfil de acesso dos usuários.
- Cadastro rápido de tutor dentro do formulário de animal.
- Exclusão em cascata controlada para tutores e clínicas.
- Auditoria de ações executadas no sistema.

### Animais

- Cadastro de nome, espécie, raça, sexo, peso, tutor e situação de castração.
- Espécie selecionável entre:
  - Felina
  - Canina
  - Outros
- Data de nascimento com entrada em formato brasileiro.
- Armazenamento técnico da data no banco em formato de data.
- Cálculo automático de idade em anos e meses.
- Exibição de idade detalhada, por exemplo:
  - `3 anos e 8 meses`
  - `8 meses`
  - `menos de 1 mês`
- Criação de tutor diretamente dentro do formulário de animal quando o tutor ainda não existir.

### Castrações

- Registro de animal vinculado.
- Registro de clínica vinculada.
- Data da castração.
- Valor do procedimento.
- Observações.
- Datas exibidas no frontend em formato brasileiro, `dd/mm/aaaa`.
- Banco mantendo a data em formato técnico adequado.
- Integração com o status de castração do animal.

### Exclusões em cascata controladas

#### Tutor

Quando um tutor possui animais vinculados, o sistema impede a exclusão direta e exibe uma janela de confirmação.

Se o usuário confirmar:

- O tutor é excluído.
- Os animais vinculados são excluídos.
- As castrações relacionadas aos animais também são removidas quando existirem.

#### Clínica

Quando uma clínica possui castrações vinculadas, o sistema impede a exclusão direta e exibe uma janela de confirmação.

Se o usuário confirmar:

- A clínica é excluída.
- As castrações vinculadas à clínica são excluídas.
- Os animais relacionados voltam para o status de não castrado, evitando inconsistência no cadastro.

### Pesquisa, filtros e ordenação

O sistema possui filtros e ordenação nas principais páginas.

#### Animais

- Pesquisa por nome do animal e tutor.
- Filtro por espécie.
- Filtro por castrado.
- Ordenação por:
  - Nome
  - Espécie
  - Raça
  - Sexo
  - Idade
  - Peso
  - Tutor
  - Castrado

#### Tutores

- Pesquisa por nome, endereço ou telefone.
- Ordenação por:
  - Nome
  - Endereço
  - Telefone

#### Clínicas

- Pesquisa por nome, telefone ou veterinário responsável.
- Ordenação por:
  - Nome
  - Telefone
  - Veterinário responsável

#### Castrações

- Pesquisa por animal, clínica ou observações.
- Filtro por período de data.
- Ordenação por:
  - Data
  - Animal
  - Clínica
  - Valor

#### Usuários

- Pesquisa por usuário, nome ou perfil.
- Filtro por perfil.
- Filtro por status.
- Ordenação por:
  - Usuário
  - Nome
  - Perfil
  - Status
  - Data de criação

### Auditoria

O sistema possui auditoria para registrar ações relevantes executadas pelos usuários.

A auditoria registra:

- Usuário responsável.
- Tipo de ação.
- Entidade afetada.
- ID do registro afetado.
- Data e hora.
- IP de origem.
- User-Agent.
- Valores antes.
- Valores depois.
- Resumo da alteração.
- Contexto do registro alterado.

A auditoria foi aprimorada para mostrar informações mais úteis, como:

- Nome do animal.
- Nome do tutor.
- Nome da clínica.
- Perfil do usuário.
- Campos alterados.
- Valores anteriores e novos valores.
- Datas em formato brasileiro.
- Idade detalhada em anos e meses.

Exemplo de auditoria enriquecida:

```json
{
  "Resumo": "Animal Zoe - alterado",
  "Usuario": "admin",
  "Acao": "ALTERACAO",
  "Entidade": "Animal",
  "RegistroId": "1",
  "Registro": {
    "Id": 1,
    "Nome": "Zoe",
    "Especie": "Canina",
    "Raca": "Shi-Tzu",
    "DataNascimento": "07/11/2022",
    "IdadeDetalhada": "3 anos e 7 meses",
    "Tutor": "Leonardo Southier"
  },
  "CamposAlterados": [
    "DataNascimento"
  ],
  "Alteracoes": {
    "DataNascimento": "16/11/2022",
    "IdadeDetalhada": "3 anos e 6 meses"
  }
}
```

---

## Versão do sistema

A versão atual é exibida no rodapé do sistema, incluindo a tela de login.

Formato exibido:

```text
PetApp - Versão 1.4.16
```

A versão é centralizada no frontend por meio do arquivo:

```text
PetApp/Views/src/appVersion.ts
```

Também pode ser mantida no arquivo:

```text
VERSION
```

Para facilitar futuras atualizações, o projeto pode utilizar o script:

```text
set-version.sh
```

Exemplo de atualização de versão:

```bash
./set-version.sh 1.4.17
docker compose up -d --build frontend
```

---

## Configuração inicial e primeiro acesso

Após clonar o repositório e subir os containers com Docker Compose, o sistema estará disponível na porta `3000`.

Usuário e senha iniciais para ambiente local:

```text
Usuário: admin
Senha: admin
```

O usuário inicial é criado com perfil:

```text
Administrador
```

Recomenda-se alterar a senha inicial após o primeiro acesso, especialmente em ambientes publicados ou acessíveis pela internet.

---

## Tecnologias utilizadas

### Backend

- .NET
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- Autenticação JWT
- Políticas de autorização por perfil
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
- Armazenamento de senhas com hash
- Controle de perfil de acesso dos usuários

### Infraestrutura

- Docker
- Docker Compose
- PostgreSQL em container
- Backend e frontend separados em containers
- Oracle Cloud Infrastructure
- Nginx como proxy reverso
- DNS público via DuckDNS
- HTTPS com certificado TLS

---

## Estrutura do projeto

```text
.
├── PetApp/
│   ├── Controllers/
│   │   ├── AnimaisController.cs
│   │   ├── AuditoriaController.cs
│   │   ├── AuthController.cs
│   │   ├── CastracoesController.cs
│   │   ├── ClinicasController.cs
│   │   ├── TutoresController.cs
│   │   └── UsuariosController.cs
│   ├── Migrations/
│   ├── Models/
│   │   ├── Dtos/
│   │   ├── Animal.cs
│   │   ├── AuditoriaSistema.cs
│   │   ├── Castracao.cs
│   │   ├── Clinica.cs
│   │   ├── PetAppContext.cs
│   │   ├── Tutor.cs
│   │   └── UsuarioSistema.cs
│   ├── Properties/
│   ├── Views/
│   │   └── src/
│   │       ├── api/
│   │       ├── assets/
│   │       ├── components/
│   │       │   ├── animais/
│   │       │   ├── auditoria/
│   │       │   ├── auth/
│   │       │   ├── castracoes/
│   │       │   ├── clinicas/
│   │       │   ├── common/
│   │       │   ├── tutores/
│   │       │   └── usuarios/
│   │       ├── store/
│   │       ├── styles/
│   │       ├── appVersion.ts
│   │       ├── App.tsx
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

## Entidades principais do sistema

### Tutor

Armazena os dados dos responsáveis pelos animais.

Exemplos de informações:

- Nome
- Endereço
- Telefone
- Animais vinculados

### Animal

Armazena as informações dos animais cadastrados pela ONG.

Exemplos de informações:

- Nome
- Espécie
- Raça
- Sexo
- Data de nascimento
- Idade calculada
- Peso
- Tutor vinculado
- Situação de castração

### Clínica

Armazena os dados das clínicas veterinárias parceiras ou utilizadas pela ONG.

Exemplos de informações:

- Nome
- Telefone
- Veterinário responsável
- Castrações vinculadas

### Castração

Armazena os registros de procedimentos de castração realizados ou agendados.

Exemplos de informações:

- Animal vinculado
- Clínica vinculada
- Data da castração
- Valor do procedimento
- Observações

### Usuário

Armazena os usuários que podem acessar o sistema.

Exemplos de informações:

- Nome de usuário
- Nome completo
- Senha protegida por hash
- Perfil de acesso
- Situação do usuário
- Data de criação
- Data de atualização

### Auditoria

Armazena registros das ações realizadas no sistema, contribuindo para rastreabilidade e controle.

Exemplos de informações:

- Usuário responsável pela ação
- Tipo de operação realizada
- Data e horário da ação
- Entidade ou registro afetado
- Valores antes e depois
- IP de origem
- User-Agent

---

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

### 5. Acessar o backend localmente

Exemplo:

```text
http://localhost:5000
```

---

## API e documentação Swagger

O backend possui documentação Swagger para testes e validação dos endpoints da API.

Em ambiente local, a documentação pode ser acessada conforme a porta configurada para o backend no `docker-compose.yml`.

Exemplo:

```text
http://localhost:5000/swagger
```

---

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

---

## Segurança e controle de acesso

O sistema possui autenticação por login e senha, impedindo o acesso não autorizado às telas internas da aplicação.

Também foram implementados recursos de controle de usuários, perfis de acesso e auditoria, permitindo maior rastreabilidade das operações realizadas no sistema.

Principais pontos de segurança aplicados:

- Autenticação com JWT.
- Token com perfil de acesso.
- Controle de acesso por policies no backend.
- Acesso restrito às telas internas.
- Usuários controlados pelo sistema.
- Senhas armazenadas com hash.
- Possibilidade de ativar ou desativar usuários.
- Bloqueio contra remoção do último administrador ativo.
- Auditoria de ações relevantes.
- Invalidação automática da sessão quando o usuário logado é alterado.
- Publicação com HTTPS em ambiente hospedado.
- Separação dos serviços em containers.

---

## Regras de controle de acesso

### Rotas de leitura

Disponíveis para:

- Leitura
- Cadastro
- Administrador

### Rotas de criação, edição e exclusão

Disponíveis para:

- Cadastro
- Administrador

### Rotas administrativas

Disponíveis somente para:

- Administrador

Incluem:

- Gestão de usuários
- Auditoria

---

## Versionamento

O projeto utiliza versionamento semântico no formato:

```text
MAJOR.MINOR.PATCH
```

Exemplo atual:

```text
1.4.16
```

Sugestão de uso:

- Alteração pequena ou correção: incrementar `PATCH`.
- Novo recurso compatível: incrementar `MINOR`.
- Mudança estrutural grande: incrementar `MAJOR`.

Exemplo:

```bash
./set-version.sh 1.4.17
git add VERSION PetApp/Views/src/appVersion.ts
git commit -m "Atualiza versão para 1.4.17"
```

Também é possível criar tags Git para marcar versões:

```bash
git tag -a v1.4.17 -m "Versão 1.4.17"
```

---

## Objetivos de Desenvolvimento Sustentável relacionados

O projeto está relacionado aos seguintes Objetivos de Desenvolvimento Sustentável, considerando o impacto social e organizacional da solução:

- ODS 03, Saúde e bem-estar
- ODS 08, Trabalho decente e crescimento econômico
- ODS 15, Vida terrestre

---

## Finalidade acadêmica

Este projeto foi desenvolvido para fins acadêmicos, como parte da Atividade Extensionista II, buscando aplicar conhecimentos de tecnologia em uma demanda real da comunidade.

A solução foi direcionada para a Associação Cuidado Animal de Teutônia, com o objetivo de apoiar a organização dos dados utilizados nos processos relacionados aos animais, tutores, clínicas veterinárias e castrações.

---

## Autor

Leonardo Luís Southier  
RU: 5151840  
Curso: CST em Redes de Computadores  
Centro Universitário Internacional UNINTER

