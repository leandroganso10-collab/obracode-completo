# ObraCode Pro Real

Versão profissional com Supabase: login real, obras, projetos, revisões, obsoletos, QR Code, upload e auditoria.

## 1. Supabase
1. Abra seu projeto Supabase.
2. Vá em SQL Editor.
3. Cole o conteúdo do arquivo `supabase-schema.sql`.
4. Clique em Run.
5. Vá em Storage e confirme que o bucket `projetos` foi criado.

## 2. Vercel
No projeto da Vercel, coloque as variáveis:

- `VITE_SUPABASE_URL` = URL do projeto Supabase, sem `/rest/v1`
- `VITE_SUPABASE_ANON_KEY` = chave publicável/anon

Depois faça Redeploy.

## 3. Primeiro acesso
1. Abra o site.
2. Clique em Criar conta.
3. Use seu e-mail e senha.
4. O primeiro usuário deve ser cadastrado na tabela `profiles` como admin. Se não aparecer admin automático, execute no SQL Editor:

```sql
update public.profiles set role='admin' where email='SEU_EMAIL_AQUI';
```

## 4. Uso
- Cadastre obras.
- Cadastre usuários/perfis.
- Envie projetos em PDF/DWG.
- Ao cadastrar uma nova revisão com o mesmo código, a anterior vira obsoleta.
- QR Code aponta para a revisão vigente.
- Auditoria registra ações. 
