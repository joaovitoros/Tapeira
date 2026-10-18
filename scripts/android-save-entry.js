import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { ScreenOrientation } from "@capacitor/screen-orientation";

// Rotação da tela (app Android). O menu de pause ganha "Girar tela" quando esta
// ponte existe — no navegador o screen.orientation.lock exige fullscreen e é
// instável, então o controle só aparece no app. `modo` é "portrait" | "landscape".
window.tapeiraOrientacao = {
    async atual() {
        try {
            const o = await ScreenOrientation.orientation();
            return o && o.type ? o.type : null; // ex.: "portrait-primary"
        } catch (e) {
            return null;
        }
    },
    async travar(modo) {
        try {
            await ScreenOrientation.lock({ orientation: modo });
            return true;
        } catch (e) {
            return false;
        }
    },
    async soltar() {
        try {
            await ScreenOrientation.unlock();
            return true;
        } catch (e) {
            return false;
        }
    }
};


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
