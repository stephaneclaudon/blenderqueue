require('./rt/electron-rt');
//////////////////////////////
// User Defined Preload scripts below

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
    "api", {
        invoke: (channel, data: Object) => {

            console.log("calling invoke!!", channel, data);
            let validChannels = ["BlenderExtract", "RunCommand"];
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, data); 
            }
        },
    }
);