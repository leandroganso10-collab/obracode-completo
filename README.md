# ObraCode Profissional - Versão Completa Base

Sistema web responsivo para gestão de projetos de obra, semelhante em conceito a plataformas profissionais de controle documental, mas com identidade própria.

## Funcionalidades incluídas
- Login demonstrativo por perfil
- Dashboard
- Obras
- Projetos
- Controle de revisões
- Arquivo obsoleto automático
- QR Code para projetos vigentes
- Tarefas
- Usuários/permissões
- Auditoria
- Layout para celular/PWA
- Schema SQL para Supabase

## Como subir no GitHub
1. Extraia este ZIP.
2. Abra a pasta extraída.
3. Confira que existem estes itens:
   - index.html
   - package.json
   - src/main.jsx
   - src/style.css
   - supabase-schema.sql
4. No GitHub, abra seu repositório.
5. Clique em Add file > Upload files.
6. Arraste TODO o conteúdo desta pasta, inclusive a pasta src.
7. Clique em Commit changes.

## Configuração na Vercel
- Framework: Vite
- Build command: npm run build
- Output directory: dist
- Install command: npm install

## Supabase
1. Crie um projeto no Supabase.
2. Abra SQL Editor.
3. Cole o conteúdo de supabase-schema.sql.
4. Execute.
5. Depois crie um bucket chamado projetos.

## Observação importante
Esta versão já publica e funciona na Vercel como sistema visual completo. O upload real de arquivos e autenticação real por e-mail/senha são a próxima etapa de integração com Supabase Auth e Supabase Storage.
