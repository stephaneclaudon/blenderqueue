require('./rt/electron-rt');
//////////////////////////////
// User Defined Preload scripts below
console.log('User Preload!');

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
    "api", {
        invoke: (channel, data: Object) => {

            console.log("calling invoke!!", channel, data);
            let validChannels = ["BlenderExtract"];
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, data); 
            }
        },
    }
);
