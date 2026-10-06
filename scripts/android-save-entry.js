import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

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
        url: file.uri,
        dialogTitle: "Salvar save do TAPeira"
    });
};
