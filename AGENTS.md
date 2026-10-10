# Guia de arquitetura e contribuição — TAPeira

Leia este arquivo antes de implementar ou alterar funcionalidades. O objetivo é manter cada mudança pequena, compreensível e compatível com Windows, Android e navegador.

## Estrutura atual e arquivos-fonte

- `index.html` e `Caverna.html` são as páginas do jogo.
- `script/` contém as regras do jogo e a interface; os arquivos são carregados como scripts clássicos, em ordem definida no HTML.
- `css/`, `imagens/` e `media/` contêm recursos-fonte.
- `desktop/` contém a integração com Electron; `scripts/` contém tarefas de build e preparação.
- `www/` é gerado/atualizado por `npm run prepare:web`. Não edite cópias dentro de `www/` como se fossem fonte.
- `dist/`, `android/` e `node_modules/` não são o local normal para implementar funcionalidades web do jogo.

Consulte também `BUILDING.md` para os comandos de execução e build.

## Regras para funcionalidades novas

1. **Defina o domínio e o dono da lógica.** Coloque regras junto ao sistema responsável (combate, loja/economia, missões, eventos, habilidades etc.). Evite acrescentar funcionalidades grandes a `script.js`, `sistema.js` ou `ui.js` apenas por conveniência. Se um sistema crescer, crie um arquivo específico em `script/` e inclua-o explicitamente em `Caverna.html` na ordem correta.
2. **Separe regras da interface.** Cálculos e decisões pertencem à lógica do domínio. A interface lê o estado e apresenta resultados; não deve ser a autoridade sobre regras, recompensas ou progresso.
3. **Não aumente o acoplamento global.** Os scripts atuais compartilham muitas funções e variáveis globais. Para código novo, prefira uma implementação encapsulada e uma API pequena em `window.Tapeira` (crie o namespace se ainda não existir). Evite novas variáveis globais, `window[nomeVariavel]`, nomes genéricos e dependências implícitas da ordem dos arquivos.
4. **Mantenha o formato atual de carregamento.** Até uma migração planejada do build, não introduza `import`/`export` ou scripts `type="module"` isoladamente: as páginas e os builds atuais usam scripts clássicos. Se uma mudança exigir módulos, ajuste e valide o fluxo web, Electron e Android em conjunto.
5. **Evite handlers inline novos.** Não adicione `onclick`, `onload` ou atributos semelhantes para código novo. Registre eventos no JavaScript com `addEventListener` e, quando fizer sentido, use atributos `data-*` como identificadores de ação. Preserve handlers existentes fora do escopo da mudança.
6. **Considere as duas páginas.** Se adicionar um arquivo de script compartilhado, confira sua inclusão e ordem em `Caverna.html` e `index.html`. O menu e a tela da caverna não têm necessariamente os mesmos elementos no DOM; trate elementos opcionais com segurança.
7. **Não crie timers sem ciclo de vida.** Guarde cada `setInterval`/`setTimeout`, impeça inicializações duplicadas e defina quando cancelar ou pausar — especialmente no reset, saída para o menu, pausa e troca de evento. Não use polling se um evento ou atualização já existente resolver o caso.
8. **Trate o save como contrato público.** Se adicionar estado persistente, atualize a criação do save, o carregamento com valor padrão para saves antigos, a validação e o reset conforme a duração do estado (por run ou permanente). Mantenha compatibilidade com saves existentes; não descarte nem renomeie campos sem migração explícita.
9. **Mantenha integrações de plataforma isoladas.** Não use APIs do Node/Electron diretamente no código web. Use a ponte segura já existente em `desktop/preload.cjs` ou os mecanismos Capacitor apropriados, com fallback para navegador quando aplicável. Preserve `contextIsolation` e `nodeIntegration: false`.
10. **Proteja a interface e os dados.** Prefira `textContent` para texto dinâmico; valide dados vindos de saves, DOM, arquivos e APIs antes de usá-los. Não suponha que um elemento exista em todas as páginas ou estados.

## Testes e validação

- Acrescente ou atualize um teste focado para a regra alterada, seguindo os testes existentes (`test-*.js` e páginas `test-*.html`). Não dependa apenas de inspeção visual para cálculos, saves ou progressão.
- Verifique ao menos o caminho normal e casos de limite (por exemplo: sem recursos, limite máximo, save antigo ou elemento ausente), conforme a funcionalidade.
- Execute os testes e o build relevante. Para mudanças em recursos compartilhados, confirme que a preparação web (`npm run prepare:web`) e a execução principal não foram quebradas; se tocar integração nativa, valide também o fluxo correspondente descrito em `BUILDING.md`.
- Informe claramente qualquer validação que não pôde ser executada.

## Escopo das mudanças

- Preserve comportamento existente e saves; faça alterações incrementais.
- Não reformate nem reescreva arquivos grandes sem necessidade para a funcionalidade solicitada.
- Evite refatorações adjacentes. Se encontrar um problema fora do escopo, registre-o como sugestão em vez de misturá-lo à implementação.
- Antes de concluir, confira `git status` e não sobrescreva alterações preexistentes do usuário.

## Checklist antes de concluir uma funcionalidade

- [ ] A lógica está no domínio responsável, sem aumentar arquivos já muito grandes sem necessidade.
- [ ] O estado persistente, defaults, validação e reset estão coerentes.
- [ ] Eventos e timers têm registro e limpeza apropriados.
- [ ] As páginas/plataformas afetadas continuam compatíveis.
- [ ] Existe teste relevante e foram executadas as validações possíveis.
- [ ] O resumo informa arquivos alterados, testes executados e limitações conhecidas.
