class GoldNumber {
    constructor(value = 0) {
        if (value instanceof GoldNumber) {
            this.m = value.m;
            this.e = value.e;
        } else {
            this.fromNumber(value);
        }
    }

    static fromMantissaExponent(m, e) {

        const n = new GoldNumber();

        n.m = m;
        n.e = e;

        n.normalize();

        return n;
    }

    compare(other) {
        const b = (other instanceof GoldNumber) ? other : new GoldNumber(other);

        if (this.e > b.e) return 1;
        if (this.e < b.e) return -1;

        if (this.m > b.m) return 1;
        if (this.m < b.m) return -1;

        return 0;
    }

    fromNumber(value) {
        if (value === 0) {
            this.m = 0;
            this.e = 0;
            return;
        }

        if (!isFinite(value)) {
            this.m = 0;
            this.e = 0;
            return;
        }

        const exp = Math.floor(Math.log10(Math.abs(value)));
        const mant = value / Math.pow(10, exp);

        this.m = mant;
        this.e = exp;
        this.normalize();
    }

    normalize() {

        if (!isFinite(this.m)) {
            this.m = 0;
            this.e = 0;
        }

        if (this.m === 0) {
            this.e = 0;
            return;
        }

        while (Math.abs(this.m) >= 10) {
            this.m /= 10;
            this.e++;
        }

        while (Math.abs(this.m) < 1) {
            this.m *= 10;
            this.e--;
        }
    }

    add(value) {
        const other = (value instanceof GoldNumber) ? value : new GoldNumber(value);

        // alinhar expoentes
        if (this.e > other.e) {
            const diff = this.e - other.e;
            this.m += other.m / Math.pow(10, diff);
        } else {
            const diff = other.e - this.e;
            this.m = this.m / Math.pow(10, diff) + other.m;
            this.e = other.e;
        }

        this.normalize();
        return this;
    }

    multiply(value) {
        const other = (value instanceof GoldNumber) ? value : new GoldNumber(value);

        this.m *= other.m;
        this.e += other.e;

        this.normalize();
        return this;
    }

    valueOf() {
        return this.m * Math.pow(10, this.e);
    }

    toNumber() {
        return this.valueOf();
    }

    format() {
        const absE = Math.abs(this.e);

        if (this.e < 3) {
            return (this.m * Math.pow(10, this.e)).toFixed(0);
        }

        const suffixes = [
            "", "K", "M", "B", "T",
            "Qa", "Qi", "Sx", "Sp", "Oc",
            "No", "Dc"
        ];

        const index = Math.floor(this.e / 3);

        if (index < suffixes.length) {
            const scaled = this.m * Math.pow(10, this.e % 3);
            return scaled.toFixed(2) + suffixes[index];
        }

        return this.m.toFixed(2) + "e+" + this.e;
    }

    isValid() {
        return isFinite(this.m) && isFinite(this.e);
    }
}

/**
 * =========================
 * FORMATAÇÃO
 * =========================
 */
function FormatarGold(valor) {

    if (!isFinite(valor)) {
        return "∞";
    }

    if (valor < 1000) {
        return Number(valor).toFixed(2);
    }

    const sufixos = [
        "K", "M", "B", "T",
        "Qa", "Qi", "Sx", "Sp",
        "Oc", "No", "Dc"
    ];

    let index = -1;

    while (valor >= 1000 && index < sufixos.length - 1) {
        valor /= 1000;
        index++;
    }

    return Number(valor).toFixed(2) + sufixos[index];
}

/**
 * =========================
 * WRAPPERS (COMPATIBILIDADE)
 * =========================
 * Isso resolve seus erros:
 * - AddGold is not defined
 * - FormatGold is not defined
 */

function AddGold(valor, aplicaBonusFormigas = true) {
    if (!(gold instanceof GoldNumber)) {
        gold = new GoldNumber(gold);
    }

    let valorFinal = valor;
    if (Number(valor) > 0) {
        // bônus permanente da Loja do Conhecimento: +1% de gold por nível
        valorFinal = Number(valor) * MultiplicadorGoldConhecimento();
        if (aplicaBonusFormigas) {
            valorFinal = valorFinal * MultiplicadorGoldFormigas();
        }
        // especialização: buff/nerf de gold no tempo do ganho (gasto não passa por aqui)
        valorFinal = valorFinal * MultiplicadorGoldEspecializacao();
    }
    gold.add(valorFinal);

    AtualizaGoldTela();
    return valorFinal;
}

function RemoveGold(valor) {
    if (!(gold instanceof GoldNumber)) {
        gold = new GoldNumber(gold);
    }

    gold.subtract(valor);

    AtualizaGoldTela();
}

function TemGold(valor) {
    if (!(gold instanceof GoldNumber)) {
        gold = new GoldNumber(gold);
    }

    return gold.compare(valor) >= 0;
}

function AddTotalGold(valor, aplicaBonusFormigas = true) {
    if (!(totalGold instanceof GoldNumber)) {
        totalGold = new GoldNumber(totalGold);
    }

    const valorFinal = aplicaBonusFormigas && Number(valor) > 0
        ? Number(valor) * MultiplicadorGoldFormigas()
        : valor;
    totalGold.add(valorFinal);
    return valorFinal;
}

function FormatGold(valor) {
    if (valor instanceof GoldNumber) {
        return valor.isValid() ? valor.format() : "0";
    }

    const n = Number(valor);
    return Number.isFinite(n) ? formatNumber(n) : "0";
}

function AtualizaGoldTela() {
    const goldDisplay = document.getElementById("contGold");
    if (goldDisplay) goldDisplay.innerHTML = FormatGold(gold);
}

function getGoldValue(gold) {

    if (!gold) return 0;

    if (gold instanceof GoldNumber) {
        return gold.toNumber();
    }

    if (typeof gold === "number") {
        return gold;
    }

    if (typeof gold === "string") {
        return Number(gold.replace(/[^\d.-]/g, "")) || 0;
    }

    return 0;
}


function formatNumber(n) {
    n = Number(n);

    if (n < 1000) return n.toFixed(2);

    const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx"];
    let unitIndex = -1;

    while (n >= 1000 && unitIndex < units.length - 1) {
        n /= 1000;
        unitIndex++;
    }

    return n.toFixed(2) + units[unitIndex];
}
