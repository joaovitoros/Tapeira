// ===================== AUDIO DO JOGO =====================================
// Sons tradicionais, áudio ambiente sintetizado e controles de volume.
// As funções e o volume seguem globais por compatibilidade com os scripts
// clássicos existentes; este arquivo concentra a responsabilidade de áudio.

function ChamaSom(som) {
	const el = document.getElementById(som);
	if (el) {
		el.volume = volumeAtual;
		el.muted = volumeAtual === 0;
		if (!el.muted) {
			el.currentTime = 0;
			el.play();
		}
	}
}

let volumeAtual = 0.05;
let volumeAmbiente = 0.3;
let contextoAudioJogo = null;
let ganhoMestreAmbiente = null;
let ambienteAudioAtivado = false;
let eventosAudioJogoRegistrados = false;

function CriaContextoAudioJogo() {
	if (contextoAudioJogo) return contextoAudioJogo;

	const AudioContextJogo = window.AudioContext || window.webkitAudioContext;
	if (!AudioContextJogo) {
		console.warn("Web Audio não está disponível; áudio ambiente e efeitos sintetizados foram desativados.");
		return null;
	}

	contextoAudioJogo = new AudioContextJogo();
	const context = contextoAudioJogo;
	ganhoMestreAmbiente = context.createGain();
	ganhoMestreAmbiente.gain.value = volumeAmbiente * 0.4;
	ganhoMestreAmbiente.connect(context.destination);

	const buffer = context.createBuffer(1, context.sampleRate * 5, context.sampleRate);
	const samples = buffer.getChannelData(0);
	const fadeSamples = Math.floor(context.sampleRate * 0.2);
	for (let index = 0; index < samples.length; index++) {
		const edgeFade = Math.min(1, index / fadeSamples, (samples.length - index - 1) / fadeSamples);
		samples[index] = (Math.random() * 2 - 1) * 0.7 * edgeFade;
	}
	const noise = context.createBufferSource();
	noise.buffer = buffer;
	noise.loop = true;
	const lowPass = context.createBiquadFilter();
	lowPass.type = "lowpass";
	lowPass.frequency.value = 420;
	const noiseGain = context.createGain();
	noiseGain.gain.value = 0.18;
	noise.connect(lowPass);
	lowPass.connect(noiseGain);
	noiseGain.connect(ganhoMestreAmbiente);
	noise.start();

	[54, 81].forEach((frequency, index) => {
		const drone = context.createOscillator();
		const droneGain = context.createGain();
		drone.type = "sine";
		drone.frequency.value = frequency;
		droneGain.gain.value = index === 0 ? 0.06 : 0.03;
		drone.connect(droneGain);
		droneGain.connect(ganhoMestreAmbiente);
		drone.start();
	});

	return context;
}

function AtivaAudioDoJogo() {
	try {
		const context = CriaContextoAudioJogo();
		if (!context) return;
		ambienteAudioAtivado = true;
		if (context.state === "suspended") {
			context.resume().catch(error => {
				console.warn("Não foi possível iniciar o áudio do jogo:", error);
			});
		}
	} catch (error) {
		console.error("Não foi possível iniciar o áudio do jogo:", error);
	}
}

function RegistraEventosAudioJogo() {
	if (eventosAudioJogoRegistrados) return;
	document.addEventListener("pointerdown", AtivaAudioDoJogo, { once: true });
	document.addEventListener("keydown", AtivaAudioDoJogo, { once: true });
	document.addEventListener("visibilitychange", () => {
		if (!contextoAudioJogo) return;
		if (document.visibilityState === "hidden") {
			contextoAudioJogo.suspend().catch(error => {
				console.warn("Não foi possível pausar o áudio em segundo plano:", error);
			});
		} else if (ambienteAudioAtivado) {
			AtivaAudioDoJogo();
		}
	});
	eventosAudioJogoRegistrados = true;
}

function AtualizaVolumeAmbiente(percentual) {
	const novoVolume = Number(percentual);
	if (!Number.isFinite(novoVolume)) {
		throw new TypeError("O volume ambiente precisa ser um número válido.");
	}

	volumeAmbiente = Math.max(0, Math.min(100, novoVolume)) / 100;
	const controle = document.getElementById("volumeAmbienteControle");
	const valor = document.getElementById("volumeAmbienteValor");
	if (controle) controle.value = String(Math.round(volumeAmbiente * 100));
	if (valor) valor.value = `${Math.round(volumeAmbiente * 100)}%`;
	if (ganhoMestreAmbiente && contextoAudioJogo) {
		ganhoMestreAmbiente.gain.setTargetAtTime(
			volumeAmbiente * 0.4,
			contextoAudioJogo.currentTime,
			0.08
		);
	}
	localStorage.setItem("volumeAmbienteJogo", String(Math.round(volumeAmbiente * 100)));
}

function TocaSomSintetico(tipo) {
	const context = contextoAudioJogo;
	if (!context || context.state !== "running" || volumeAtual <= 0) return;

	const agora = context.currentTime;
	if (tipo === "impacto" || tipo === "critico") {
		const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.075), context.sampleRate);
		const samples = buffer.getChannelData(0);
		for (let index = 0; index < samples.length; index++) {
			samples[index] = (Math.random() * 2 - 1) * (1 - index / samples.length);
		}
		const source = context.createBufferSource();
		const filter = context.createBiquadFilter();
		const gain = context.createGain();
		source.buffer = buffer;
		filter.type = "lowpass";
		filter.frequency.value = tipo === "critico" ? 520 : 340;
		gain.gain.setValueAtTime(volumeAtual * (tipo === "critico" ? 0.55 : 0.34), agora);
		gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.075);
		source.connect(filter);
		filter.connect(gain);
		gain.connect(context.destination);
		source.start(agora);
		source.onended = () => {
			source.disconnect();
			filter.disconnect();
			gain.disconnect();
		};

		if (tipo === "critico") {
			const tone = context.createOscillator();
			const toneGain = context.createGain();
			tone.type = "triangle";
			tone.frequency.setValueAtTime(740, agora);
			tone.frequency.exponentialRampToValueAtTime(230, agora + 0.12);
			toneGain.gain.setValueAtTime(volumeAtual * 0.2, agora);
			toneGain.gain.exponentialRampToValueAtTime(0.001, agora + 0.12);
			tone.connect(toneGain);
			toneGain.connect(context.destination);
			tone.start(agora);
			tone.stop(agora + 0.13);
			tone.onended = () => {
				tone.disconnect();
				toneGain.disconnect();
			};
		}
		return;
	}

	if (tipo === "andar") {
		[392, 523.25, 659.25].forEach((frequency, index) => {
			const tone = context.createOscillator();
			const gain = context.createGain();
			const start = agora + index * 0.085;
			tone.type = "triangle";
			tone.frequency.value = frequency;
			gain.gain.setValueAtTime(0.001, start);
			gain.gain.linearRampToValueAtTime(volumeAtual * 0.22, start + 0.025);
			gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);
			tone.connect(gain);
			gain.connect(context.destination);
			tone.start(start);
			tone.stop(start + 0.25);
			tone.onended = () => {
				tone.disconnect();
				gain.disconnect();
			};
		});
	}

	if (tipo === "guardiao") {
		[196, 146.83, 110].forEach((frequency, index) => {
			const tone = context.createOscillator();
			const gain = context.createGain();
			const start = agora + index * 0.12;
			tone.type = "triangle";
			tone.frequency.setValueAtTime(frequency, start);
			tone.frequency.exponentialRampToValueAtTime(frequency * 0.72, start + 0.3);
			gain.gain.setValueAtTime(0.001, start);
			gain.gain.linearRampToValueAtTime(volumeAtual * 0.28, start + 0.035);
			gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
			tone.connect(gain);
			gain.connect(context.destination);
			tone.start(start);
			tone.stop(start + 0.33);
			tone.onended = () => {
				tone.disconnect();
				gain.disconnect();
			};
		});
	}
}

function AtualizaVolume(percentual) {
	const novoVolume = Number(percentual);
	if (!Number.isFinite(novoVolume)) {
		throw new TypeError("O volume precisa ser um número válido.");
	}

	volumeAtual = Math.max(0, Math.min(100, novoVolume)) / 100;

	document.querySelectorAll("audio").forEach(audio => {
		audio.volume = volumeAtual;
		audio.muted = volumeAtual === 0;
	});

	const controle = document.getElementById("volumeControle");
	const valor = document.getElementById("volumeValor");
	if (controle) controle.value = String(Math.round(volumeAtual * 100));
	if (valor) valor.value = Math.round(volumeAtual * 100) + "%";

	localStorage.setItem("volumeJogo", String(Math.round(volumeAtual * 100)));
}
