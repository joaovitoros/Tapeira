import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

// Exportar: grava o save no cache e abre a folha de compartilhamento. É por
// aqui que o Bluetooth aparece como destino (o arquivo vai anexado em `files`;
// no Android o campo `url` é ignorado pelo plugin).
window.tapeiraAndroidSave = async function (json, fileName) {
    const file = await Filesystem.writeFile({
        path: fileName,
        data: json,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
    });

    await Share.share({
        title: "Save do TAPeira",
        text: "Escolha onde salvar ou compartilhar seu progresso.",
        files: [file.uri],
        dialogTitle: "Salvar save do TAPeira"
    });
};

// Receber: janela aberta com um save ("Abrir com TAPeira" ou Share → TAPeira).
// O MainActivity entrega o JSON por um destes dois caminhos:
//  - push: chama window.tapeiraAndroidRecebeu(json);
//  - pull: o jogo pergunta via window.TapeiraAndroid.pegaSaveRecebido().
function importaSaveRecebido() {
    try {
        const texto = window.TapeiraAndroid?.pegaSaveRecebido?.();
        if (texto && typeof ImportarSaveJson === "function") ImportarSaveJson(texto);
    } catch (e) {
        console.error("Falha ao importar o save recebido:", e);
    }
}

window.tapeiraAndroidRecebeu = function (json) {
    if (typeof ImportarSaveJson === "function") ImportarSaveJson(json);
};

// O save pode chegar junto com o onCreate: tenta algumas vezes no começo.
if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", () => {
        importaSaveRecebido();
        setTimeout(importaSaveRecebido, 1200);
        setTimeout(importaSaveRecebido, 3000);
    });
} else {
    importaSaveRecebido();
    setTimeout(importaSaveRecebido, 1200);
    setTimeout(importaSaveRecebido, 3000);
}
