// ===================== PERSISTÊNCIA DO JOGO =============================
// Exportação/importação do save em arquivo JSON.
// A montagem do estado (Carregar) ficou em persistencia-carregar.js e o
// auto save local em persistencia-autosave.js. APIs globais mantidas.
// O objeto exportado reusa CriarObjetoSave(false) (sem os campos offline).


// =========================
// SAVE
// =========================

function Salvar() {

	qtdSave++;
	AutoSaveLocal();

	const save = CriarObjetoSave(false);

	save.saveFormat = "tapeira-save";
	save.saveVersion = 1;
	save.exportedAt = new Date().toISOString();
	const saveJson = JSON.stringify(save);
	const fileName = "TAPeira-save-" + save.exportedAt.replace(/[:.]/g, "-") + ".json";

	if (window.tapeiraDesktop?.saveJson) {
		window.tapeiraDesktop.saveJson(saveJson, fileName).then(result => {
			MostraInfo(result.canceled ? "Salvamento cancelado." : "Save exportado com sucesso.");
		}).catch(error => {
			console.error("Erro ao exportar o save:", error);
			MostraInfo("Não foi possível exportar o save.");
		});
		return;
	}

	if (typeof window.tapeiraAndroidSave === "function") {
		window.tapeiraAndroidSave(saveJson, fileName).then(() => {
			MostraInfo("Escolha onde salvar ou compartilhar o arquivo JSON.");
		}).catch(error => {
			console.error("Erro ao exportar o save no Android:", error);
			MostraInfo("Não foi possível exportar o save.");
		});
		return;
	}

	saveAs(
		new Blob([saveJson], { type: "application/json;charset=utf-8" }),
		fileName
	);

	MostraInfo("Save exportado.");
}

// =========================
// CARREGAR ARQUIVO
// =========================

// Núcleo da importação: valida e aplica um save a partir do CONTEÚDO JSON.
// Usado pelo arquivo escolhido no input e também quando o app Android recebe
// um save por Bluetooth/Compartilhar.
function ImportarSaveJson(texto) {
	try {
		// Valida antes de liberar o auto save: um JSON incompatível não pode
		// substituir nem desbloquear o progresso local que falhou no load.
		ValidarSave(JSON.parse(texto));
		autoSaveBloqueadoPorIncompatibilidade = false;
		const autoSaveAtualizado = Carregar(texto);
		MostraInfo(autoSaveAtualizado
			? "Save importado e progresso local atualizado."
			: "Save importado, mas não foi possível atualizar o auto save local.");
		return true;
	} catch (error) {
		console.error("Não foi possível importar o save:", error);
		MostraInfo(`Save inválido ou incompatível: ${error.message} O progresso atual foi mantido.`);
		return false;
	}
}

function CarregarArquivo(input) {
	const fileInput = input || document.getElementById("txtfiletoread");
	const file = fileInput?.files?.[0];
	if (!file) return;

	fileInput.value = "";
	if (!file.name.toLowerCase().endsWith(".json")) {
		MostraInfo("Selecione um arquivo de save .json.");
		return;
	}

	const reader = new FileReader();
	reader.onload = function () {
		ImportarSaveJson(reader.result);
	};
	reader.onerror = function () {
		console.error("Não foi possível ler o arquivo de save:", reader.error);
		MostraInfo("Não foi possível ler o arquivo de save.");
	};
	reader.readAsText(file);
}
