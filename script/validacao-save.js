// ===================== VALIDAÇÃO DE SAVES ==============================
// Regras de compatibilidade e integridade dos dados persistidos.

// =========================
// LOAD
// =========================

function ValidarRecompensasOffline(recompensas, limiteTempo, limiteBaus) {
	if (!recompensas || typeof recompensas !== "object" || Array.isArray(recompensas)) {
		throw new TypeError("As recompensas offline do save são inválidas.");
	}

	for (const key of ["tempoMs", "dano", "gold", "abates", "inimigosTela"]) {
		if (!Number.isFinite(recompensas[key]) || recompensas[key] < 0) {
			throw new TypeError("As recompensas offline do save são inválidas.");
		}
	}
	if (recompensas.tempoMs > limiteTempo
		|| !Number.isInteger(recompensas.abates)
		|| !Number.isInteger(recompensas.inimigosTela)
		|| recompensas.inimigosTela > 4) {
		throw new TypeError("Os limites das recompensas offline do save são inválidos.");
	}

	if (!Array.isArray(recompensas.vidasInimigos) || recompensas.vidasInimigos.length !== 4
		|| recompensas.vidasInimigos.some(vida => !Number.isFinite(vida) || vida < 0)) {
		throw new TypeError("As vidas dos inimigos no progresso offline são inválidas.");
	}

	if (!Array.isArray(recompensas.baus) || recompensas.baus.length > limiteBaus
		|| recompensas.baus.some(bau => !bau || typeof bau !== "object"
			|| !Number.isFinite(bau.gold) || bau.gold < 0
			|| !Number.isInteger(bau.esmeraldas) || bau.esmeraldas < 0)) {
		throw new TypeError("Os baús do progresso offline são inválidos.");
	}
	if (recompensas.formigas !== undefined
		&& (!Array.isArray(recompensas.formigas) || recompensas.formigas.length !== FORMIGAS.length
			|| recompensas.formigas.some(total => !Number.isSafeInteger(total) || total < 0))) {
		throw new TypeError("As formigas do progresso offline são inválidas.");
	}
	if (recompensas.xp !== undefined
		&& (!Number.isSafeInteger(recompensas.xp) || recompensas.xp < 0)) {
		throw new TypeError("A experiência do progresso offline é inválida.");
	}
	if (recompensas.bonusRetorno !== undefined) {
		const bonus = recompensas.bonusRetorno;
		if (!bonus || typeof bonus !== "object" || Array.isArray(bonus)
			|| !Number.isFinite(bonus.horas) || bonus.horas < 2 || bonus.horas > 24
			|| !Number.isFinite(bonus.gold) || bonus.gold < 0
			|| !Number.isSafeInteger(bonus.esmeraldas) || bonus.esmeraldas < 0 || bonus.esmeraldas > 6
			|| (bonus.gold <= 0 && bonus.esmeraldas <= 0)) {
			throw new TypeError("O bônus de retorno do progresso offline é inválido.");
		}
	}
}

// Pico de andar da run: fonte dos pontos de perk. Saves antigos, sem o campo,
// valem pelo portão pago (a mesma regra antiga dos pontos).
function PicoRunDoSave(save) {
	const pico = save.andarMaxRun !== undefined
		? save.andarMaxRun
		: Math.max(save.andar ?? 1, save.gateDanoPago ?? ((save.andarVolta ?? 1) - 5));
	return Math.max(pico, save.andar ?? 1, 1);
}

function ValidarSave(save) {
	if (!save || typeof save !== "object" || Array.isArray(save)) {
		throw new TypeError("O arquivo não contém um save válido.");
	}

	if (save.saveFormat !== undefined && save.saveFormat !== "tapeira-save") {
		throw new TypeError("Este arquivo não é um save do TAPeira.");
	}

	if (save.saveFormat === "tapeira-save" && save.saveVersion === undefined) {
		throw new TypeError("A versão do save não foi informada.");
	}

	if (save.saveVersion !== undefined) {
		if (!Number.isInteger(save.saveVersion) || save.saveVersion < 1) {
			throw new TypeError("A versão do save é inválida.");
		}
		if (save.saveVersion > 1) {
			throw new TypeError("Este save foi criado por uma versão mais nova do TAPeira.");
		}
		if (save.saveFormat !== "tapeira-save") {
			throw new TypeError("O formato do save é inválido.");
		}
	}

	if (save.exportedAt !== undefined && typeof save.exportedAt !== "string") {
		throw new TypeError("A data de exportação do save é inválida.");
	}

	if (!Number.isFinite(save.andar) || save.andar < 1) {
		throw new TypeError("O save não contém um andar válido.");
	}

	if (save.marcoGoldRun !== undefined
		&& (!Number.isSafeInteger(save.marcoGoldRun) || save.marcoGoldRun < 0
			|| save.marcoGoldRun % 10 !== 0)) {
		throw new TypeError("O marco de gold da run no save é inválido.");
	}

	if (save.marcosNivel50 !== undefined
		&& (!Number.isSafeInteger(save.marcosNivel50) || save.marcosNivel50 < 0
			|| save.marcosNivel50 > 10000)) {
		throw new TypeError("O marco de 50 níveis do save é inválido.");
	}

	if (save.resetsCurtosCM !== undefined
		&& (!Number.isSafeInteger(save.resetsCurtosCM) || save.resetsCurtosCM < 0
			|| save.resetsCurtosCM > 10000)) {
		throw new TypeError("O contador de resets curtos do save é inválido.");
	}

	if (save.gateDanoPago !== undefined
		&& (!Number.isSafeInteger(save.gateDanoPago) || save.gateDanoPago < 5
			|| save.gateDanoPago % 5 !== 0)) {
		throw new TypeError("O portão de dano do reset no save é inválido.");
	}

	if (save.andarMaxRun !== undefined
		&& (!Number.isSafeInteger(save.andarMaxRun) || save.andarMaxRun < 1)) {
		throw new TypeError("O pico de andar da run no save é inválido.");
	}

	if (save.danoResetQtd !== undefined
		&& (!Number.isSafeInteger(save.danoResetQtd) || save.danoResetQtd < 0
			|| save.danoResetQtd > 10000)) {
		throw new TypeError("O bônus de dano de reset no save é inválido.");
	}

	// coerência: pós-35 o portão pago é sempre o anterior ao próximo reset
	// (impede "reivindicar" um portão antigo de novo editando o save)
	if (save.gateDanoPago >= 35 && save.andarVolta !== save.gateDanoPago + 5) {
		throw new TypeError("O portão de dano não bate com o próximo reset do save.");
	}
	if (save.gateDanoPago < 35 && save.andarVolta > 35) {
		throw new TypeError("O portão de dano não bate com o próximo reset do save.");
	}

	// perks: inteiros dentro do teto de cada um; gastos não podem exceder os
	// pontos do pico de andar desta run (1 ponto por portão >= 35 alcançado)
	const perkKeys = [
		["perkDano", 0, 4],
		["perkEletrica", 0, 3],
		["perkGold", 0, 4],
		["perkFuga", 0, 5],
		["perkFrenesi", 0, 4]
	];
	let perkGastos = 0;
	for (const [key, minimo, maximo] of perkKeys) {
		const valor = save[key];
		if (valor === undefined) continue;
		if (!Number.isSafeInteger(valor) || valor < minimo || valor > maximo) {
			throw new TypeError("Os níveis de perk do save são inválidos.");
		}
		perkGastos = perkGastos + valor;
	}
	if (perkGastos > 0) {
		const picoRun = PicoRunDoSave(save);
		const perkGanhos = picoRun >= 35 ? Math.floor((picoRun - 35) / 5) + 1 : 0;
		if (perkGastos > perkGanhos) {
			throw new TypeError("Os perks do save excedem os pontos do pico da run.");
		}
	}

	// item de 1 nível da loja de esmeraldas: dobra o CM ganho (0 ou 1)
	if (save.lvlEsmCM !== undefined
		&& (!Number.isSafeInteger(save.lvlEsmCM) || save.lvlEsmCM < 0 || save.lvlEsmCM > 1)) {
		throw new TypeError("O nível do item de CM da loja de esmeraldas é inválido.");
	}

	// Patentes da loja de gold: inteiros dentro do teto de cada item (Qtd
	// Avanço é infinito por patente, com teto só de saneamento)
	const patenteKeys = [
		["patenteBau", 1],
		["patenteBEspaco", 1],
		["patenteQTDAvan", 10000],
		["patenteCCrit", 4],
		["patenteSubVida", 5],
		["patenteAvan", 4],
		["patenteEsmBau", 4],
		["patenteVelComp", 2],
		["patenteDano", 5],
		["patenteDCrit", 5]
	];
	for (const [key, maximo] of patenteKeys) {
		const valor = save[key];
		if (valor === undefined) continue;
		if (!Number.isSafeInteger(valor) || valor < 0 || valor > maximo) {
			throw new TypeError("As patentes da loja do save são inválidas.");
		}
	}
	// item de esmeralda no baú: nível inteiro dentro dos segmentos das patentes
	if (save.lvlEsmBau !== undefined
		&& (!Number.isSafeInteger(save.lvlEsmBau) || save.lvlEsmBau < 0 || save.lvlEsmBau > 60)) {
		throw new TypeError("O nível do item de esmeralda do baú é inválido.");
	}
	if (save.precoEsmBau !== undefined
		&& (!Number.isFinite(save.precoEsmBau) || save.precoEsmBau < 1)) {
		throw new TypeError("O preço do item de esmeralda do baú é inválido.");
	}
	// Velocidade do Companheiro: nível e preço dentro dos tetos das patentes;
	// o efeito é 1,0 (base) até 2,0 (★III) com folga de float nos passos 0,2
	if (save.lvlVelComp !== undefined
		&& (!Number.isSafeInteger(save.lvlVelComp) || save.lvlVelComp < 1 || save.lvlVelComp > 30)) {
		throw new TypeError("O nível da Velocidade do Companheiro no save é inválido.");
	}
	if (save.precoVelComp !== undefined
		&& (!Number.isFinite(save.precoVelComp) || save.precoVelComp < 1)) {
		throw new TypeError("O preço da Velocidade do Companheiro no save é inválido.");
	}
	if (save.velAtaqueComp !== undefined
		&& (!Number.isFinite(save.velAtaqueComp) || save.velAtaqueComp < 1 || save.velAtaqueComp > 2.05)) {
		throw new TypeError("A velocidade de ataque do companheiro no save é inválida.");
	}

	// Conquistas comportamentais: flags 0/1 em lista de 5, contadores inteiros
	// e cronômetro de run dentro dos limites de um save legítimo (campos ausentes = save antigo)
	if (save.conquistasComp !== undefined
		&& (!Array.isArray(save.conquistasComp)
			|| save.conquistasComp.length !== CONQUISTAS_COMP.length
			|| save.conquistasComp.some((v, i) => !Number.isInteger(v) || v < 0 || v > CONQUISTAS_COMP[i].max))) {
		throw new TypeError("As conquistas comportamentais do save são inválidas.");
	}
	if (save.missoesCompletas !== undefined
		&& (!Number.isSafeInteger(save.missoesCompletas) || save.missoesCompletas < 0 || save.missoesCompletas > 1000000)) {
		throw new TypeError("O contador de missões do save é inválido.");
	}
	if (save.desafiosVencidos !== undefined
		&& (!Number.isSafeInteger(save.desafiosVencidos) || save.desafiosVencidos < 0 || save.desafiosVencidos > 1000000)) {
		throw new TypeError("O contador de desafios vencidos no save é inválido.");
	}
	if (save.comprasRun !== undefined
		&& (!Number.isSafeInteger(save.comprasRun) || save.comprasRun < 0 || save.comprasRun > 1000000)) {
		throw new TypeError("O contador de compras da run no save é inválido.");
	}
	if (save.runInicioMs !== undefined
		&& (!Number.isFinite(save.runInicioMs) || save.runInicioMs <= 0
			|| save.runInicioMs > Date.now() + 300000)) {
		throw new TypeError("O cronômetro da run no save é inválido.");
	}
	if (save.melhorGoldRun !== undefined) {
		const mg = save.melhorGoldRun;
		if (!mg || typeof mg !== "object" || Array.isArray(mg)
			|| !Number.isFinite(mg.m) || !Number.isFinite(mg.e)) {
			throw new TypeError("O melhor gold de run do save é inválido.");
		}
	}

	// Conhecimento Mug: inteiros não negativos; níveis respeitam o teto de cada item
	const cmKeys = [
		["conhecimentoMug", 0, 1000000000],
		["derrotadosRun", 0, 1000000000],
		["cmNivelDano", 0, 10000],
		["cmNivelGold", 0, 10000],
		["cmNivelXp", 0, 10000],
		["cmNivelFuga", 0, 10000],
		["cmNivelCrit", 0, 10000],
		["cmNivelFormiga", 0, 50],
		["cmNivelDuasFormigas", 0, 100],
		["cmNivelComp", 0, 10000],
		["cmNivelGoldComp2", 0, 10000]
	];
	for (const [key, minimo, maximo] of cmKeys) {
		const valor = save[key];
		if (valor === undefined) continue;
		if (!Number.isSafeInteger(valor) || valor < minimo || valor > maximo) {
			throw new TypeError("Os dados de Conhecimento Mug do save são inválidos.");
		}
	}
	// anti-cheat: os abates desta run não podem superar o total de abates
	if (save.derrotadosRun !== undefined && save.totalDerrotados !== undefined
		&& save.derrotadosRun > save.totalDerrotados) {
		throw new TypeError("Os abates da run do save excedem o total de abates.");
	}

	for (const key of ["gold", "totalGold"]) {
		const currency = save[key];
		if (!currency || typeof currency !== "object"
			|| !Number.isFinite(currency.m) || !Number.isFinite(currency.e)) {
			throw new TypeError("O save não contém dados de gold válidos.");
		}
	}

	const formigaKeys = [
		"formigasVermelhas", "formigasAmarelas", "formigasMarrons",
		"formigasPretas", "formigasCinzas"
	];
	for (const key of formigaKeys) {
		if (save[key] !== undefined && (!Number.isSafeInteger(save[key]) || save[key] < 0)) {
			throw new TypeError("A coleção permanente de formigas do save é inválida.");
		}
	}
	const xpKeys = [
		["nivelJogador", 1, Number.MAX_SAFE_INTEGER],
		["xpAtual", 0, Number.MAX_SAFE_INTEGER],
		["pontosHabilidade", 0, Number.MAX_SAFE_INTEGER],
		["nivelSkillDano", 0, NIVEL_MAXIMO_SKILLS],
		["nivelSkillEletrica", 0, NIVEL_MAXIMO_SKILLS],
		["nivelSkillGold", 0, NIVEL_MAXIMO_SKILLS],
		["nivelSkillFuga", 0, NIVEL_MAXIMO_SKILLS],
		["nivelSkillFrenesi", 0, NIVEL_MAXIMO_SKILLS],
		["ramoSkillDano", 0, 2],
		["ramoSkillEletrica", 0, 2],
		["ramoSkillGold", 0, 2],
		["ramoSkillFuga", 0, 2],
		["ramoSkillFrenesi", 0, 2]
	];
	for (const [key, minimo, maximo] of xpKeys) {
		if (save[key] !== undefined
			&& (!Number.isSafeInteger(save[key]) || save[key] < minimo || save[key] > maximo)) {
			throw new TypeError("Os dados de experiência ou habilidades do save são inválidos.");
		}
	}
	if (save.progressoBauDourado !== undefined
		&& (!Number.isFinite(save.progressoBauDourado)
			|| save.progressoBauDourado < 0
			|| save.progressoBauDourado > TEMPO_BAU_DOURADO_JOGO)) {
		throw new TypeError("O progresso do baú dourado no save é inválido.");
	}
	if (save.bauDouradoPendente !== undefined
		&& (!Number.isInteger(save.bauDouradoPendente)
			|| save.bauDouradoPendente < 0
			|| save.bauDouradoPendente > 1)) {
		throw new TypeError("O estado do baú dourado no save é inválido.");
	}
	if (save.autoColeta !== undefined
		&& (!Number.isInteger(save.autoColeta)
			|| save.autoColeta < 0
			|| save.autoColeta > 1)) {
		throw new TypeError("O estado da auto-coleta no save é inválido.");
	}
	if (save.autoCompra !== undefined
		&& (!Number.isInteger(save.autoCompra)
			|| save.autoCompra < 0
			|| save.autoCompra > 1)) {
		throw new TypeError("O estado da auto-compra no save é inválido.");
	}
	if (save.autoItensLoja !== undefined
		&& (!Array.isArray(save.autoItensLoja)
			|| save.autoItensLoja.length > 64
			|| save.autoItensLoja.some(v => v !== 0 && v !== 1))) {
		throw new TypeError("A seleção de auto-compra da loja no save é inválida.");
	}
	if (save.autoGasto !== undefined
		&& (!Number.isInteger(save.autoGasto)
			|| save.autoGasto < 0
			|| save.autoGasto > 1)) {
		throw new TypeError("O estado do auto-gasto no save é inválido.");
	}
	if (save.especializacao !== undefined
		&& (!Number.isInteger(save.especializacao)
			|| save.especializacao < 0
			|| save.especializacao > 5)) {
		throw new TypeError("A especialização no save é inválida.");
	}
	if (save.especializacaoTrocas !== undefined
		&& (!Number.isInteger(save.especializacaoTrocas)
			|| save.especializacaoTrocas < 0
			|| save.especializacaoTrocas > TROCA_ESPECIALIZACAO_MAX)) {
		throw new TypeError("A contagem de trocas de especialização no save é inválida.");
	}
	if (save.itensBuild !== undefined
		&& (!Array.isArray(save.itensBuild)
			|| save.itensBuild.length > Tapeira.ItensBuild.LIMITE
			|| save.itensBuild.some(id => !Tapeira.ItensBuild.item(id)))) {
		throw new TypeError("Os itens da build no save são inválidos.");
	}
	if (save.bauBuildPendente !== undefined
		&& save.bauBuildPendente !== true
		&& save.bauBuildPendente !== false) {
		throw new TypeError("O estado do baú de itens da build no save é inválido.");
	}
	if (save.bausBuildPendentes !== undefined
		&& (!Number.isSafeInteger(save.bausBuildPendentes) || save.bausBuildPendentes < 0)) {
		throw new TypeError("A quantidade de baús de itens da build no save é inválida.");
	}
	if (save.opcoesBauBuild !== undefined && save.opcoesBauBuild !== null
		&& (!Array.isArray(save.opcoesBauBuild)
			|| save.opcoesBauBuild.length !== 3
			|| new Set(save.opcoesBauBuild).size !== 3
			|| save.opcoesBauBuild.some(id => !Tapeira.ItensBuild.item(id))
			|| (save.bausBuildPendentes ?? (save.bauBuildPendente === true ? 1 : 0)) === 0)) {
		throw new TypeError("As opções do baú de itens da build no save são inválidas.");
	}
	if (save.ultimaAtualizacaoBauDourado !== undefined
		&& (!Number.isFinite(save.ultimaAtualizacaoBauDourado)
			|| save.ultimaAtualizacaoBauDourado < 0)) {
		throw new TypeError("A data do progresso do baú dourado no save é inválida.");
	}
	if (save.multiplicadorMaximoDanoCritico !== undefined
		&& (!Number.isFinite(save.multiplicadorMaximoDanoCritico)
			|| save.multiplicadorMaximoDanoCritico < 4)) {
		throw new TypeError("O limite de dano crítico no save é inválido.");
	}
	const limiteTempoSalvo = maxTempoProgressoOffline
		+ Math.floor((save.formigasPretas ?? 0) / 5) * 2 * 60 * 1000;
	const limiteBausSalvo = maxBausOffline + Math.floor((save.formigasCinzas ?? 0) / 5);
	if (save.offlineLastSavedAt !== undefined
		&& (!Number.isFinite(save.offlineLastSavedAt) || save.offlineLastSavedAt < 0)) {
		throw new TypeError("A data do último salvamento offline é inválida.");
	}
	if (save.offlinePendingRewards !== undefined && save.offlinePendingRewards !== null) {
		ValidarRecompensasOffline(save.offlinePendingRewards, limiteTempoSalvo, limiteBausSalvo);
	}

	for (const [key, value] of Object.entries(save)) {
		// campos não-numéricos já validados especificamente acima (shape conferido)
		if (["saveFormat", "saveVersion", "exportedAt", "gold", "totalGold", "offlinePendingRewards",
			"conquistasComp", "melhorGoldRun", "autoItensLoja",
			"itensBuild", "bauBuildPendente", "opcoesBauBuild"].includes(key)) continue;
		if (typeof value !== "number" || !Number.isFinite(value)) {
			throw new TypeError("O save contém dados inválidos.");
		}
	}
}
