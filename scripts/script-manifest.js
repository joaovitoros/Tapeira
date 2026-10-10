// ===================== LISTA ÚNICA DE SCRIPTS ==========================
// Ordem em que cada página carrega os scripts clássicos no <head>.
// Fonte única: `scripts/sync-scripts.js` gera o bloco entre os marcadores
// <!-- scripts:start --> e <!-- scripts:end --> em cada HTML.
// Rode `npm run sync:scripts` depois de mudar esta lista.
// O teste "as páginas carregam exatamente os scripts da lista única" garante
// que o HTML não saiu de sincronia.

module.exports = {
    "Caverna.html": [
        "script/break_infinity.min.js",
        "script/sistema.js",
        "script/audio.js",
        "script/gold.js",
        "script/keymap.js",
        "script/script.js",
        "script/progressao.js",
        "script/conquistas.js",
        "script/companheiros.js",
        "script/recompensas.js",
        "script/logs.js",
        "script/ui.js",
        "script/ui-skills.js",
        "script/ui-colecao.js",
        "script/ui-combate.js",
        "script/ui-baus.js",
        "script/ui-telas.js",
        "script/missoes.js",
        "script/batalha.js",
        "script/loja.js",
        "script/loja-patentes.js",
        "script/loja-compras.js",
        "script/loja-esmeraldas.js",
        "script/loja-preview.js",
        "script/FileSaver.js",
        "script/eventos.js",
        "script/automacao.js",
        "script/especializacoes.js",
        "script/ramos.js",
        "script/itens-build.js",
        "script/validacao-save.js",
        "script/persistencia-carregar.js",
        "script/persistencia-autosave.js",
        "script/persistencia.js",
        "script/progresso-offline.js"
    ],
    "index.html": [
        "script/break_infinity.min.js",
        "script/sistema.js",
        "script/audio.js",
        "script/gold.js",
        "script/keymap.js",
        "script/script.js",
        "script/progressao.js",
        "script/conquistas.js",
        "script/companheiros.js",
        "script/recompensas.js",
        "script/logs.js",
        "script/ui.js",
        "script/ui-skills.js",
        "script/ui-colecao.js",
        "script/ui-combate.js",
        "script/ui-baus.js",
        "script/ui-telas.js",
        "script/batalha.js",
        "script/loja.js",
        "script/loja-patentes.js",
        "script/loja-compras.js",
        "script/loja-esmeraldas.js",
        "script/loja-preview.js",
        "script/itens-build.js"
    ]
};
