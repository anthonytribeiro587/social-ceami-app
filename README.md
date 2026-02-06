# Social CEAMI App

Sistema web para gestão social desenvolvido para o CEAMI, com foco no controle de famílias cadastradas, estoque, montagem de cestas básicas e entregas mensais.

---

## ✨ Funcionalidades

### 👨‍👩‍👧‍👦 Famílias
- Cadastro de famílias
- Status: PENDING, APPROVED, REJECTED
- Controle de ativação (is_active)
- CPF único por família
- Alerta de endereço duplicado
- Apenas famílias aprovadas e ativas podem receber cestas

### 📦 Estoque
- Cadastro de itens
- Entrada e saída de estoque
- Controle de saldo por item
- Histórico de movimentações
- Receita da cesta

### 🧺 Cestas & Entregas
- Montagem de cestas com base no estoque
- Regra: 1 entrega por família por mês
- Registro de responsável pela entrega
- Possibilidade de estorno com histórico

### 🔐 Autenticação
- Login via Supabase Auth
- Rotas administrativas protegidas
- Acesso restrito à área /admin
- Controle de permissões por perfil

---

## 🛠️ Tecnologias

- Next.js (App Router)
- TypeScript
- Supabase (Auth + PostgreSQL)
- Tailwind CSS

---

## 🚀 Como rodar o projeto

### 1️⃣ Clonar o repositório

git clone https://github.com/seu-usuario/social-ceami-app.git
cd social-ceami-app

2️⃣ Instalar dependências
npm install

3️⃣ Variáveis de ambiente
Crie um arquivo .env.local:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

4️⃣ Rodar o projeto
npm run dev
Acesse:

http://localhost:3000/login

---

## 📜 Regras de Negócio

- Apenas famílias **APPROVED** e `is_active = true` recebem cesta
- Cada família pode receber **1 cesta por mês**
- Entregas podem ser **estornadas**, mantendo histórico
- Estoque sempre reflete **entradas e saídas**

---

## 🧪 Usuário de Teste (dev)

- **Email:** teste@gmail.com  
- **Senha:** 321  
- **Perfil:** admin  

⚠️ Não usar em produção

---

## 📄 Licença

Projeto de uso interno do CEAMI
