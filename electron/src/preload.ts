require('./rt/electron-rt');
//////////////////////////////
// User Defined Preload scripts below

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
    "electronAPI", {
    invoke: (channel, data: Object) => {
        console.log("-----------------");
        console.log("Invoking", channel);
        console.log("-----------------");
        let validChannels = [
            "BlenderExtract",
            "Render",
            "StopRender",
            "PauseRender",
            "ResumeRender",
            "SavePreview",
            "GetData",
            "SaveData"
        ];
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, data);
        }
    },
    onRenderUpdate: (callback) => ipcRenderer.on('onRenderUpdate', callback),
    onRenderError: (callback) => ipcRenderer.on('onRenderError', callback),
    onRenderClose: (callback) => ipcRenderer.on('onRenderClose', callback),
    onRenderExit: (callback) => ipcRenderer.on('onRenderExit', callback),
}
);
