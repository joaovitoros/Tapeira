const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tapeiraDesktop", {
    saveJson: (json, fileName) => ipcRenderer.invoke("save-game-json", json, fileName),
    getDisplaySettings: () => ipcRenderer.invoke("get-display-settings"),
    setDisplaySettings: (settings) => ipcRenderer.invoke("set-display-settings", settings),
    quit: () => ipcRenderer.invoke("quit-game")
});
