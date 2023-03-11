import { Button } from "antd";
import * as React from "react";
import {
    IGetMachineTranslationsSourceLanguages,
    IGetMachineTranslationsTargetLanguages
} from "../api/v1/MachineTranslationsAPI";
import { CustomModal } from "./CustomModal";

function NoLanguagesLoaded() {
    return <i>No languages loaded.</i>;
}

export function SupportedMachineTranslationLanguagesModal(props: {
    visible: boolean;
    supportedSourceLanguages: IGetMachineTranslationsSourceLanguages;
    supportedTargetLanguages: IGetMachineTranslationsTargetLanguages;
    onCancelRequest();
}) {
    const supportedSourceElements =
        props.supportedSourceLanguages?.data?.map((supportedSourceLanguage) => {
            return <li key={supportedSourceLanguage.id}>{supportedSourceLanguage.attributes.name}</li>;
        }) || [];

    const supportedTargetElements =
        props.supportedTargetLanguages?.data?.map((supportedTargetLanguage) => {
            return <li key={supportedTargetLanguage.id}>{supportedTargetLanguage.attributes.name}</li>;
        }) || [];

    return (
        <CustomModal
            title="Supported languages for machine translation"
            visible={props.visible}
            footer={
                <div style={{ margin: "6px 0" }}>
                    <Button
                        onClick={() => {
                            props.onCancelRequest();
                        }}
                    >
                        Close
                    </Button>
                </div>
            }
            onCancel={props.onCancelRequest}
        >
            <p>
                This is the list of all languages for which machine translation is available. The source language is
                used as the source for machine translation into other languages (as source language is the default
                language of your project used).
            </p>
            <div style={{ display: "flex" }}>
                <div style={{ width: "50%" }}>
                    <h1>Source languages</h1>
                    <ul>{supportedSourceElements.length > 0 ? supportedSourceElements : <NoLanguagesLoaded />}</ul>
                </div>

                <div style={{ width: "50%" }}>
                    <h1>Target languages</h1>
                    <ul>{supportedTargetElements.length > 0 ? supportedTargetElements : <NoLanguagesLoaded />}</ul>
                </div>
            </div>
        </CustomModal>
    );
}
