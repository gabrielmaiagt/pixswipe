# Pix Swipe — Guia de Configuração

Este guia descreve os passos necessários para colocar sua plataforma Pix Swipe em operação, conectando o código às suas contas do Firebase e Cakto.

## 1. Configuração do Firebase
1. **Crie um projeto** no [Console do Firebase](https://console.firebase.google.com/).
2. **Ative o Authentication** (Método E-mail/Senha).
3. **Crie um Banco de Dados Firestore** (Modo Produção).
4. **Habilite o Storage** (Para upload de criativos, opcional).
5. **Obtenha suas credenciais**:
   - Vá em Configurações do Projeto > Seus Aplicativos > Adicionar App (Web).
   - Copie as variáveis `apiKey`, `authDomain`, etc.
   - Para o **Admin SDK**, vá em Configurações do Projeto > Contas de Serviço > Gerar nova chave privada.

## 2. Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto baseado no `.env.example` e preencha:

```env
# SDK Cliente
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
... (outras variáveis do SDK cliente)

# SDK Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID=xxx
FIREBASE_ADMIN_CLIENT_EMAIL=xxx
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Cakto
CAKTO_WEBHOOK_SECRET=xxx (obtido no painel da Cakto)
CAKTO_CHECKOUT_URL_STARTER=https://checkout.cakto.com.br/plan_id_1
CAKTO_CHECKOUT_URL_PRO=https://checkout.cakto.com.br/plan_id_2
CAKTO_CHECKOUT_URL_ANNUAL=https://checkout.cakto.com.br/plan_id_3
```

## 3. Webhooks da Cakto
No painel da Cakto, configure a URL de Webhook para:
`https://seu-dominio.com/api/webhooks/cakto`

Sempre que um pagamento for aprovado, a Cakto enviará um sinal para esta URL e o Pix Swipe liberará o acesso do usuário automaticamente.

## 4. Criando seu Primeiro Admin
1. Execute o projeto localmente: `npm run dev`.
2. Acesse `http://localhost:3000/cadastro` e crie sua conta.
3. Acesse `http://localhost:3000/setup`.
4. Clique em **"Tornar-me Admin"**.
5. Agora você terá acesso total ao painel em `/admin`.

## 5. Subindo Dados de Teste
Para ver como o sistema fica com conteúdo real:
1. Vá ao Painel Admin (`/admin`).
2. No bloco **"Modo Teste"**, clique em **"Gerar dados de teste"**.
3. Isso criará 10 ofertas, 5 módulos e 30 usuários fictícios para você navegar.
