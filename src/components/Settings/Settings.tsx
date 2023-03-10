import React, { useState, useRef, useEffect } from 'react';
import {
    IonButtons,
    IonButton,
    IonModal,
    IonHeader,
    IonContent,
    IonToolbar,
    IonTitle,
    IonItem,
    IonLabel,
    IonInput,
    useIonLoading,
    IonCheckbox,
} from '@ionic/react';
import { OverlayEventDetail } from '@ionic/core/components';
import './Settings.css';
import * as Services from '../../services/services';
import { RenderItemData } from '../../data/RenderItemData';
import { BlenderQueueData } from '../../data/SettingsData';

export interface SettingsProps {
    onSettingsLoaded: Function,
    onSettingsUpdated: Function,
    session: Array<RenderItemData>
};

let inited = false;
let settingsLoaded = false;
let settingsAreValid = false;
let progressInfosPathIsValid = false;

const Settings: React.FC<SettingsProps> = (props) => {
    const [presentLoading, dismissLoading] = useIonLoading();
    const [appSettings, setAppSettings] = useState(new BlenderQueueData());

    const inputExe = useRef<HTMLIonInputElement>(null);
    const blenderExeInputFile = useRef<HTMLInputElement>(null);

    const inputProgress = useRef<HTMLIonInputElement>(null);

    const modal = useRef<HTMLIonModalElement>(null);


    const onExePathChange = (event: any) => {
        appSettings.settings.blenderBinaryPath = event.target.value;
        saveData();
    };

    const onBlenderExeChange = (event: any) => {
        if (blenderExeInputFile.current?.files && blenderExeInputFile.current.files.length > 0) {
            //@ts-ignore
            appSettings.settings.blenderBinaryPath = blenderExeInputFile.current?.files[0].path;
            saveData();
        }
    }


    const onProgressGUIChange = (event: any) => {
        appSettings.settings.saveProgressInfosGUI = event.target.checked;
        saveData();
    };

    const onProgressTxtChange = (event: any) => {
        appSettings.settings.saveProgressInfosTxt = event.target.checked;
        saveData();
    };

    const onProgressPathChange = (event: any) => {
        console.log("onProgressPathChange", event);

        appSettings.settings.saveProgressInfosPath = event.target.value;
        saveData();
    };

    const browseFolder = () => {
        Services.BrowseFolder().then((data: any) => {
            if (data.filePaths.length > 0) {
                appSettings.settings.saveProgressInfosPath = data.filePaths[0];
                saveData();
            }
        }).catch((error: any) => {
            console.error(error);
        });
    }

    const saveData = () => {
        setAppSettings({ ...appSettings });
        Services.SaveData(appSettings).then(() => {
            props.onSettingsUpdated();
        }).catch((error) => {
            console.log("Settings.tsx, failed to save session.", error);
        });
    }

    function onWillDismiss(ev: CustomEvent<OverlayEventDetail>) {
        if (ev.detail.role === 'confirm') {
            saveData();
        }
    }

    useEffect(() => {
        if (settingsLoaded) {
            appSettings.session = props.session;
            saveData();
        }
    }, [props.session]);

    if (!inited) {
        Services.GetData().then((data: BlenderQueueData) => {
            setAppSettings({ ...data });
            props.onSettingsLoaded(data);
        }).catch(() => {
            console.log("Settings.tsx, could not retrieve App Settings");
        }).finally(() => {
            settingsLoaded = true;
            dismissLoading();
        });
        presentLoading({
            message: 'Loading, please wait...'
        })
        inited = true;
    }

    progressInfosPathIsValid = ((!appSettings.settings.saveProgressInfosGUI && !appSettings.settings.saveProgressInfosTxt)
        || ((appSettings.settings.saveProgressInfosGUI || appSettings.settings.saveProgressInfosTxt) && appSettings.settings.saveProgressInfosPath !== ''));
    settingsAreValid = appSettings.settings.blenderBinaryPath !== '' && progressInfosPathIsValid;

    return (
        <IonModal
            ref={modal}
            trigger="open-settings"
            onWillDismiss={(ev) => onWillDismiss(ev)}
            canDismiss={settingsAreValid}
            id="settings">
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                    </IonButtons>
                    <IonTitle class="ion-text-center">Settings</IonTitle>
                    <IonButtons slot="end">
                        <IonButton strong={true} onClick={() => modal.current?.dismiss({}, 'confirm')} disabled={!settingsAreValid}>
                            Close
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonItem className={`${appSettings.settings.blenderBinaryPath !== '' && 'ion-valid'} ${appSettings.settings.blenderBinaryPath === '' && 'ion-invalid item-has-focus'}`}>
                    <IonLabel position="stacked">Blender path</IonLabel>
                    <IonInput ref={inputExe} type="text" placeholder="Enter path to Blender's executable file" value={appSettings.settings.blenderBinaryPath} onIonChange={onExePathChange} />
                    <IonButton onClick={() => blenderExeInputFile.current?.click()} slot="end">Browse</IonButton>
                    <input onChange={onBlenderExeChange} ref={blenderExeInputFile} id="blender-path-input" type="file" placeholder=""></input>
                </IonItem>

                <IonItem className={`${progressInfosPathIsValid && 'ion-valid'} ${progressInfosPathIsValid === false && 'ion-invalid item-has-focus'}`}>
                    <IonLabel position="stacked">Progress information save path</IonLabel>
                    <IonInput ref={inputProgress} type="text" placeholder="Enter path to a folder, for saving progress data" value={appSettings.settings.saveProgressInfosPath} onIonChange={onProgressPathChange} />
                    <IonButton onClick={browseFolder} slot="end">Browse</IonButton>
                </IonItem>

                <IonItem>
                    <IonLabel>Save progress information (Text)</IonLabel>
                    <IonCheckbox slot="end" checked={appSettings.settings.saveProgressInfosTxt} value={appSettings.settings.saveProgressInfosTxt} onIonChange={onProgressTxtChange}></IonCheckbox>
                </IonItem>

                <IonItem>
                    <IonLabel>Save progress information (GUI)</IonLabel>
                    <IonCheckbox slot="end" checked={appSettings.settings.saveProgressInfosGUI} value={appSettings.settings.saveProgressInfosGUI} onIonChange={onProgressGUIChange}></IonCheckbox>
                </IonItem>


            </IonContent>
        </IonModal>
    );
}

export default Settings;
