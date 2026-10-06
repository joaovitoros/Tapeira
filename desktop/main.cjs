const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");

const resolutionPresets = new Set(["1024x768", "1280x800", "1366x768", "1600x900", "1920x1080"]);
const displaySettingsPath = path.join(app.getPath("userData"), "display-settings.json");

function readDisplaySettings() {
    try {
        const saved = JSON.parse(fsSync.readFileSync(displaySettingsPath, "utf8"));
        const resolution = resolutionPresets.has(saved.resolution) ? saved.resolution : "1280x800";
        return {
            resolution,
            fullscreen: saved.fullscreen === true
        };
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Não foi possível ler as configurações de tela:", error);
        }
        return { resolution: "1280x800", fullscreen: false };
    }
}

let displaySettings = readDisplaySettings();

ipcMain.handle("save-game-json", async (event, json, fileName) => {
    if (typeof json !== "string") throw new TypeError("O save precisa ser texto JSON.");
    JSON.parse(json);

    const window = BrowserWindow.fromWebContents(event.sender);
    const safeFileName = typeof fileName === "string"
        && path.basename(fileName) === fileName
        && fileName.toLowerCase().endsWith(".json")
        ? fileName
        : "TAPeira-save.json";
    const result = await dialog.showSaveDialog(window, {
        title: "Salvar progresso do TAPeira",
        defaultPath: path.join(app.getPath("documents"), safeFileName),
        buttonLabel: "Salvar save",
        filters: [{ name: "Arquivo JSON", extensions: ["json"] }]
    });
    if (result.canceled || !result.filePath) return { canceled: true };

    await fs.writeFile(result.filePath, json, "utf8");
    return { canceled: false, filePath: result.filePath };
});

ipcMain.handle("get-display-settings", () => displaySettings);

ipcMain.handle("set-display-settings", async (event, settings) => {
    if (!settings || !resolutionPresets.has(settings.resolution)
        || typeof settings.fullscreen !== "boolean") {
        throw new TypeError("As configurações de tela são inválidas.");
    }

    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) throw new Error("A janela do jogo não está disponível.");

    const [width, height] = settings.resolution.split("x").map(Number);
    const nextSettings = { resolution: settings.resolution, fullscreen: settings.fullscreen };
    await fs.writeFile(displaySettingsPath, JSON.stringify(nextSettings, null, 2), "utf8");
    displaySettings = nextSettings;

    if (nextSettings.fullscreen) {
        if (!window.isFullScreen()) window.setFullScreen(true);
    } else {
        if (window.isFullScreen()) {
            window.setFullScreen(false);
            // O Electron conclui a saida da tela cheia no proximo ciclo; aguardar
            // evita que o redimensionamento seja descartado pelo Windows.
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        // A resoluÃ§Ã£o escolhida representa a Ã¡rea Ãºtil do jogo, sem contar bordas.
        window.setContentSize(width, height);
        window.center();
    }

    return displaySettings;
});

ipcMain.handle("quit-game", () => {
    app.quit();
});

function createWindow() {
    const window = new BrowserWindow({
        width: Number(displaySettings.resolution.split("x")[0]),
        height: Number(displaySettings.resolution.split("x")[1]),
        minWidth: 800,
        minHeight: 600,
        fullscreen: displaySettings.fullscreen,
        backgroundColor: "#100d0a",
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            preload: path.join(__dirname, "preload.cjs")
        }
    });

    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.loadFile(path.join(__dirname, "..", "index.html"));
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
