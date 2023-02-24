require('./rt/electron-rt');
//////////////////////////////
// User Defined Preload scripts below

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
    "electronAPI", {
    invoke: (channel, data: Object) => {
        //console.log("-----------------");
        //console.log("Invoking", channel);
        //console.log("-----------------");
        let validChannels = [
            "BlenderExtract",
            "Render",
            "StopRender",
            "PauseRender",
            "ResumeRender",
            "SavePreview",
            "GetData",
            "SaveData",
            "ShowItemInFolder",
            "ShowOpenDialog",
            "SetProgress",
            "CheckOutputFolder",
            "ShowSaveDialog"
        ];
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, data);
        }
    },
    onRenderUpdate: (callback) => { 
        ipcRenderer.removeAllListeners('onRenderUpdate');
        ipcRenderer.addListener('onRenderUpdate', callback)
    },
    onRenderError: (callback) => { 
        ipcRenderer.removeAllListeners('onRenderError');
        ipcRenderer.addListener('onRenderError', callback)
    },
    onRenderClose: (callback) => { 
        ipcRenderer.removeAllListeners('onRenderClose');
        ipcRenderer.addListener('onRenderClose', callback)
    },
    onRenderExit: (callback) => {
        ipcRenderer.removeAllListeners('onRenderExit');
        ipcRenderer.addListener('onRenderExit', callback)
    },
    blenderExecutablePathError: (callback) => ipcRenderer.on('blenderExecutablePathError', callback),
}
);
