# AuZap API - Documentação CRUD

## Visão Geral

API RESTful para gerenciamento de contatos, pets, serviços e agendamentos de uma clínica veterinária.

**Base URL (Produção):** `https://auzap-mvp.onrender.com`
**Base URL (Local):** `http://localhost:3000`

---

## Autenticação

Todas as requisições devem incluir `organization_id` (via query params ou body) para garantir isolamento de dados via RLS (Row Level Security) do Supabase.

---

## Endpoints

### 1. CONTACTS (Contatos/Tutores)

#### 1.1 Criar Contato
```http
POST /api/contacts
Content-Type: application/json

{
  "organization_id": "uuid",
  "phone": "5511999999999",
  "name": "João Silva",
  "email": "joao@example.com",
  "notes": "Cliente preferencial"
}
```

**Validações:**
- `organization_id` (obrigatório): UUID válido
- `phone` (obrigatório): mínimo 10 caracteres
- `email` (opcional): formato válido
- `name`, `notes` (opcionais)

**Resposta (201):**
```json
{
  "id": "uuid",
  "organization_id": "uuid",
  "phone": "5511999999999",
  "name": "João Silva",
  "email": "joao@example.com",
  "status": "active",
  "notes": "Cliente preferencial",
  "created_at": "2025-10-02T00:00:00Z",
  "last_contact_at": "2025-10-02T00:00:00Z"
}
```

#### 1.2 Listar Contatos
```http
GET /api/contacts?organization_id=uuid&status=active&search=João&limit=20&offset=0
```

**Query Params:**
- `organization_id` (obrigatório): UUID da organização
- `status` (opcional): active, inactive, blocked
- `search` (opcional): busca por nome, telefone ou email
- `limit` (opcional): quantidade de resultados (padrão: 10)
- `offset` (opcional): paginação

**Resposta (200):**
```json
{
  "contacts": [...],
  "total": 100
}
```

#### 1.3 Buscar Contato por ID
```http
GET /api/contacts/:id?organization_id=uuid
```

**Resposta (200):**
```json
{
  "id": "uuid",
  "organization_id": "uuid",
  "phone": "5511999999999",
  "name": "João Silva",
  "email": "joao@example.com",
  "status": "active",
  "pets": [
    {
      "id": "uuid",
      "name": "Rex",
      "species": "dog"
    }
  ],
  "created_at": "2025-10-02T00:00:00Z"
}
```

#### 1.4 Atualizar Contato
```http
PUT /api/contacts/:id
Content-Type: application/json

{
  "organization_id": "uuid",
  "name": "João Silva Atualizado",
  "email": "novo@email.com",
  "status": "active"
}
```

#### 1.5 Deletar Contato (Soft Delete)
```http
DELETE /api/contacts/:id?organization_id=uuid
```

**Resposta (200):**
```json
{
  "success": true
}
```

#### 1.6 Contatos Inativos
```http
GET /api/contacts/analytics/inactive?organization_id=uuid&days=60
```

Retorna contatos sem interação nos últimos X dias.

---

### 2. PETS (Animais de Estimação)

#### 2.1 Criar Pet
```http
POST /api/pets
Content-Type: application/json

{
  "organization_id": "uuid",
  "contact_id": "uuid",
  "name": "Rex",
  "species": "dog",
  "breed": "Golden Retriever",
  "age": 3,
  "weight": 25.5,
  "color": "Dourado",
  "notes": "Muito brincalhão",
  "medical_conditions": "Nenhuma"
}
```

**Validações:**
- `organization_id`, `contact_id`, `name` (obrigatórios)
- `age`: inteiro positivo
- `weight`: número positivo
- Demais campos opcionais

**Resposta (201):**
```json
{
  "id": "uuid",
  "organization_id": "uuid",
  "contact_id": "uuid",
  "name": "Rex",
  "species": "dog",
  "breed": "Golden Retriever",
  "age": 3,
  "weight": 25.5,
  "color": "Dourado",
  "is_active": true,
  "created_at": "2025-10-02T00:00:00Z"
}
```

#### 2.2 Listar Pets
```http
GET /api/pets?organization_id=uuid&species=dog&search=Rex&limit=20&offset=0
```

**Resposta (200):**
```json
{
  "pets": [
    {
      "id": "uuid",
      "name": "Rex",
      "species": "dog",
      "contact": {
        "name": "João Silva",
        "phone": "5511999999999"
      }
    }
  ],
  "total": 50
}
```

#### 2.3 Buscar Pet por ID
```http
GET /api/pets/:id?organization_id=uuid
```

#### 2.4 Atualizar Pet
```http
PUT /api/pets/:id
Content-Type: application/json

{
  "organization_id": "uuid",
  "weight": 26.0,
  "notes": "Atualizou peso após consulta"
}
```

#### 2.5 Deletar Pet (Soft Delete)
```http
DELETE /api/pets/:id?organization_id=uuid
```

#### 2.6 Pets Precisando de Serviço
```http
GET /api/pets/analytics/needing-service?organization_id=uuid&service_type=grooming&days=30
```

Retorna pets que não tiveram serviço do tipo especificado nos últimos X dias.

---

### 3. SERVICES (Serviços Oferecidos)

#### 3.1 Criar Serviço
```http
POST /api/services
Content-Type: application/json

{
  "organization_id": "uuid",
  "name": "Banho e Tosa",
  "service_type": "grooming",
  "description": "Banho completo com tosa higiênica",
  "duration_minutes": 90,
  "price": 80.00
}
```

**Validações:**
- `organization_id`, `name`, `service_type` (obrigatórios)
- `duration_minutes`: inteiro positivo
- `price`: número não-negativo

#### 3.2 Listar Serviços
```http
GET /api/services?organization_id=uuid&service_type=grooming&is_active=true&search=Banho&limit=20
```

**Resposta (200):**
```json
{
  "services": [
    {
      "id": "uuid",
      "name": "Banho e Tosa",
      "service_type": "grooming",
      "duration_minutes": 90,
      "price": 80.00,
      "is_active": true
    }
  ],
  "total": 15
}
```

#### 3.3 Buscar Serviço por ID
```http
GET /api/services/:id?organization_id=uuid
```

#### 3.4 Atualizar Serviço
```http
PUT /api/services/:id
Content-Type: application/json

{
  "organization_id": "uuid",
  "price": 90.00,
  "is_active": true
}
```

#### 3.5 Deletar Serviço (Soft Delete)
```http
DELETE /api/services/:id?organization_id=uuid
```

#### 3.6 Serviços Mais Populares
```http
GET /api/services/analytics/popular?organization_id=uuid&date_from=2025-01-01&date_to=2025-12-31&limit=10
```

#### 3.7 Receita por Serviço
```http
GET /api/services/analytics/revenue?organization_id=uuid&date_from=2025-01-01&date_to=2025-12-31
```

**Resposta (200):**
```json
[
  {
    "service_id": "uuid",
    "name": "Banho e Tosa",
    "type": "grooming",
    "total": 8000.00,
    "count": 100,
    "average": 80.00
  }
]
```

---

### 4. BOOKINGS (Agendamentos)

#### 4.1 Criar Agendamento
```http
POST /api/bookings
Content-Type: application/json

{
  "organization_id": "uuid",
  "contact_id": "uuid",
  "pet_id": "uuid",
  "service_id": "uuid",
  "scheduled_date": "2025-10-15T14:00:00Z",
  "duration_minutes": 90,
  "notes": "Pet precisa de atenção especial"
}
```

**Validações:**
- Todos os IDs devem ser UUIDs válidos
- `scheduled_date`: formato ISO 8601
- Verifica disponibilidade de horário automaticamente

**Resposta (201):**
```json
{
  "id": "uuid",
  "organization_id": "uuid",
  "contact": { "name": "João Silva" },
  "pet": { "name": "Rex" },
  "service": { "name": "Banho e Tosa" },
  "scheduled_date": "2025-10-15T14:00:00Z",
  "status": "scheduled",
  "created_at": "2025-10-02T00:00:00Z"
}
```

#### 4.2 Listar Agendamentos
```http
GET /api/bookings?organization_id=uuid&status=scheduled&pet_id=uuid&date_from=2025-10-01&date_to=2025-10-31&limit=20
```

**Query Params:**
- `organization_id` (obrigatório)
- `status`: scheduled, confirmed, completed, cancelled, no_show
- `pet_id`, `contact_id`: filtrar por pet ou contato
- `date_from`, `date_to`: filtro de período

**Resposta (200):**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "scheduled_date": "2025-10-15T14:00:00Z",
      "status": "scheduled",
      "pet": { "name": "Rex", "species": "dog" },
      "contact": { "name": "João Silva", "phone": "5511999999999" },
      "service": { "name": "Banho e Tosa", "service_type": "grooming" }
    }
  ],
  "total": 50
}
```

#### 4.3 Buscar Agendamento por ID
```http
GET /api/bookings/:id?organization_id=uuid
```

#### 4.4 Atualizar Agendamento
```http
PUT /api/bookings/:id
Content-Type: application/json

{
  "organization_id": "uuid",
  "scheduled_date": "2025-10-15T15:00:00Z",
  "status": "confirmed",
  "actual_amount": 80.00
}
```

**Status válidos:**
- `scheduled`: agendado
- `confirmed`: confirmado
- `completed`: concluído
- `cancelled`: cancelado
- `no_show`: não compareceu

#### 4.5 Cancelar Agendamento
```http
POST /api/bookings/:id/cancel
Content-Type: application/json

{
  "organization_id": "uuid",
  "reason": "Cliente solicitou reagendamento"
}
```

#### 4.6 Verificar Horários Disponíveis
```http
GET /api/bookings/availability/slots?organization_id=uuid&date=2025-10-15&duration=90
```

**Resposta (200):**
```json
[
  {
    "start": "2025-10-15T08:00:00Z",
    "end": "2025-10-15T09:30:00Z",
    "available": true
  },
  {
    "start": "2025-10-15T09:00:00Z",
    "end": "2025-10-15T10:30:00Z",
    "available": false
  }
]
```

#### 4.7 Analytics de Agendamentos
```http
GET /api/bookings/analytics/summary?organization_id=uuid&date_from=2025-01-01&date_to=2025-12-31
```

**Resposta (200):**
```json
{
  "total": 500,
  "by_status": {
    "completed": 400,
    "scheduled": 80,
    "cancelled": 20
  },
  "by_service": {
    "grooming": 300,
    "consultation": 200
  },
  "revenue": 40000.00
}
```

---

## Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Dados inválidos ou faltando parâmetros
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro no servidor

---

## Segurança e RLS

Todos os endpoints validam `organization_id` para garantir que:

1. Usuários só acessem dados da própria organização
2. Row Level Security (RLS) do Supabase isola dados automaticamente
3. Queries sempre incluem filtro por `organization_id`

---

## Paginação

Para endpoints de listagem:

- `limit`: quantidade de resultados (padrão: 10, máximo: 100)
- `offset`: posição inicial para paginação
- Resposta inclui `total` para calcular páginas

**Exemplo:**
```http
GET /api/contacts?organization_id=uuid&limit=20&offset=40
```
Retorna contatos 41-60 de um total de 100.

---

## Filtros de Busca

Endpoints de listagem suportam busca textual:

- **Contacts**: busca em `name`, `phone`, `email`
- **Pets**: busca em `name`, `breed`
- **Services**: busca em `name`, `description`

**Exemplo:**
```http
GET /api/pets?organization_id=uuid&search=Rex
```

---

## Soft Delete

Recursos não são deletados permanentemente:

- **Contacts**: `status` = `inactive`
- **Pets**: `is_active` = `false`
- **Services**: `is_active` = `false`
- **Bookings**: `status` = `cancelled`

Permite recuperação de dados e mantém histórico.

---

## Relacionamentos

### Contacts → Pets (1:N)
Um contato pode ter vários pets.

### Bookings → Contact, Pet, Service (N:1)
Cada agendamento referencia um contato, pet e serviço.

---

## Exemplos de Uso

### Criar um novo cliente com pet
```bash
# 1. Criar contato
curl -X POST https://auzap-mvp.onrender.com/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "123e4567-e89b-12d3-a456-426614174000",
    "phone": "5511999999999",
    "name": "João Silva",
    "email": "joao@example.com"
  }'

# 2. Criar pet (usando contact_id retornado)
curl -X POST https://auzap-mvp.onrender.com/api/pets \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "123e4567-e89b-12d3-a456-426614174000",
    "contact_id": "contact-uuid-aqui",
    "name": "Rex",
    "species": "dog",
    "breed": "Golden Retriever",
    "age": 3
  }'
```

### Criar agendamento
```bash
curl -X POST https://auzap-mvp.onrender.com/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "123e4567-e89b-12d3-a456-426614174000",
    "contact_id": "contact-uuid",
    "pet_id": "pet-uuid",
    "service_id": "service-uuid",
    "scheduled_date": "2025-10-15T14:00:00Z",
    "duration_minutes": 90
  }'
```

### Buscar agendamentos do dia
```bash
curl "https://auzap-mvp.onrender.com/api/bookings?organization_id=123e4567-e89b-12d3-a456-426614174000&date_from=2025-10-15T00:00:00Z&date_to=2025-10-15T23:59:59Z&status=scheduled"
```

---

## Arquivos Importantes

- **Rotas**: `/backend/src/routes/*.routes.ts`
- **Services**: `/backend/src/services/*.service.ts`
- **Validadores**: `/backend/src/validators/crud.validators.ts`
- **Middleware**: `/backend/src/middleware/validate.middleware.ts`
