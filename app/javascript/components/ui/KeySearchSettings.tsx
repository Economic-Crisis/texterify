import { Checkbox, DatePicker, Select } from "antd";
import * as React from "react";
import { APIUtils } from "../api/v1/APIUtils";
import FlagIcon from "./FlagIcons";
import * as queryString from "query-string";
import { history } from "../routing/history";
import moment from "moment";
import { useLocation } from "react-router";

export function parseKeySearchSettingsFromURL(): ISearchSettings {
    const currentQueryParams = queryString.parse(history.location.search);

    return {
        languageIds: currentQueryParams.l as string[],
        exportConfigIds: currentQueryParams.ec as string[],
        showOnlyUntranslated: currentQueryParams.ou === "true",
        onlyHTMLEnabled: currentQueryParams.he === "true",
        checkCase: currentQueryParams.cc === "true",
        showOnlyKeysWithOverwrites: currentQueryParams.oo === "true",
        changedBefore: currentQueryParams.cb as string,
        changedAfter: currentQueryParams.ca as string
    };
}

export function useQuery() {
    return queryString.parse(useLocation().search);
}

export interface ISearchSettings {
    languageIds: string[];
    exportConfigIds: string[];
    showOnlyUntranslated: boolean;
    onlyHTMLEnabled: boolean;
    checkCase: boolean;
    showOnlyKeysWithOverwrites: boolean;
    changedBefore: string;
    changedAfter: string;
}

// l == languages
// ec == export configs
// ou == only untranslated
// cc == check case
// oo == only overrides
// ca == changed after
// cb == changed before
// he == html enabled
export interface ISearchSettingsQueryParams {
    l?: string | string[];
    ec?: string | string[];
    ou?: boolean;
    cc?: boolean;
    oo?: boolean;
    ca?: moment.Moment;
    cb?: moment.Moment;
    he?: boolean;
}

export function KeySearchSettings(props: {
    languagesResponse: any;
    exportConfigsResponse: any;
    onChange(options: ISearchSettings): void;
}) {
    const currentQueryParams = useQuery();

    const [selectedLanguages, setSelectedLanguages] = React.useState<string | string[]>(currentQueryParams.l);
    const [selectedExportConfigs, setSelectedExportConfigs] = React.useState<string | string[]>(currentQueryParams.ec);
    const [onlyUntranslated, setOnlyUntranslated] = React.useState<boolean>(currentQueryParams.ou === "true");
    const [checkCase, setCheckCase] = React.useState<boolean>(currentQueryParams.cc === "true");
    const [onlyHTMLEnabled, setOnlyKeysWithHTMLEnabled] = React.useState<boolean>(currentQueryParams.he === "true");
    const [onlyKeysWithOverwrites, setOnlyKeysWithOverwrites] = React.useState<boolean>(
        currentQueryParams.oo === "true"
    );
    const [changedBefore, setChangedBefore] = React.useState<moment.Moment>(
        currentQueryParams.cb !== undefined ? moment(currentQueryParams.cb) : undefined
    );
    const [changedAfter, setChangedAfter] = React.useState<moment.Moment>(
        currentQueryParams.ca !== undefined ? moment(currentQueryParams.ca) : undefined
    );

    function onChange() {
        const query: ISearchSettingsQueryParams = {};

        query.l = selectedLanguages;
        query.ec = selectedExportConfigs;

        if (onlyUntranslated) {
            query.ou = onlyUntranslated;
        }

        if (checkCase) {
            query.cc = checkCase;
        }

        if (onlyKeysWithOverwrites) {
            query.oo = onlyKeysWithOverwrites;
        }

        if (onlyHTMLEnabled) {
            query.he = onlyHTMLEnabled;
        }

        query.ca = changedAfter;
        query.cb = changedBefore;

        const searchString = queryString.stringify(query);
        history.push({
            search: searchString
        });

        props.onChange(parseKeySearchSettingsFromURL());
    }

    React.useEffect(() => {
        onChange();
    }, [
        selectedLanguages,
        selectedExportConfigs,
        onlyUntranslated,
        checkCase,
        onlyKeysWithOverwrites,
        changedBefore,
        changedAfter,
        onlyHTMLEnabled
    ]);

    const languagesForFilterSelectOptions = props.languagesResponse.data.map((language) => {
        const countryCode = APIUtils.getIncludedObject(
            language.relationships.country_code.data,
            props.languagesResponse.included
        );

        return {
            value: language.id,
            label: language.attributes.name,
            content: (
                <>
                    {countryCode && (
                        <span style={{ marginRight: 8 }}>
                            <FlagIcon code={countryCode.attributes.code.toLowerCase()} />
                        </span>
                    )}
                    {language.attributes.name}
                </>
            )
        };
    }, []);

    return (
        <div style={{ width: 640, display: "flex" }}>
            <div style={{ width: "50%", marginRight: 40 }}>
                <h4>Filter by languages</h4>
                <Select
                    showSearch
                    placeholder="Select languages"
                    style={{ width: "100%" }}
                    onChange={(values: string[]) => {
                        setSelectedLanguages(values);
                    }}
                    optionFilterProp="label"
                    filterOption
                    mode="multiple"
                    defaultValue={selectedLanguages}
                >
                    {languagesForFilterSelectOptions.map((option) => {
                        return (
                            <Select.Option value={option.value} key={option.value} label={option.label}>
                                {option.content}
                            </Select.Option>
                        );
                    })}
                </Select>

                <h4 style={{ marginTop: 16 }}>Filter by export configs</h4>
                <Select
                    placeholder="Select export configs"
                    style={{ width: "100%" }}
                    onChange={(values: string[]) => {
                        setSelectedExportConfigs(values);
                    }}
                    mode="multiple"
                    defaultValue={selectedExportConfigs}
                >
                    {props.exportConfigsResponse.data.map((exportConfig) => {
                        return (
                            <Select.Option value={exportConfig.id} key={exportConfig.id}>
                                {exportConfig.attributes.name}
                            </Select.Option>
                        );
                    })}
                </Select>

                <Checkbox
                    onChange={(event) => {
                        setCheckCase(event.target.checked);
                    }}
                    style={{ marginTop: 16, marginLeft: 0, width: "100%" }}
                    defaultChecked={checkCase}
                >
                    Check case
                </Checkbox>
                <Checkbox
                    onChange={(event) => {
                        setOnlyUntranslated(event.target.checked);
                    }}
                    style={{ marginTop: 16, marginLeft: 0, width: "100%" }}
                    defaultChecked={onlyUntranslated}
                >
                    Show only untranslated keys
                </Checkbox>
                <Checkbox
                    onChange={(event) => {
                        setOnlyKeysWithOverwrites(event.target.checked);
                    }}
                    style={{ marginTop: 16, marginLeft: 0, width: "100%" }}
                    defaultChecked={onlyKeysWithOverwrites}
                >
                    Show only keys with overwrites
                </Checkbox>
                <Checkbox
                    onChange={(event) => {
                        setOnlyKeysWithHTMLEnabled(event.target.checked);
                    }}
                    style={{ marginTop: 16, marginLeft: 0, width: "100%" }}
                    defaultChecked={onlyHTMLEnabled}
                >
                    Show only keys with HTML enabled
                </Checkbox>
            </div>

            <div style={{ width: "50%" }}>
                <h4>Changed after</h4>
                <DatePicker
                    onSelect={(value) => {
                        setChangedAfter(value);
                    }}
                    onChange={(value) => {
                        setChangedAfter(value);
                    }}
                    placeholder="Select date"
                    style={{ width: "100%" }}
                    defaultValue={changedAfter}
                />

                <h4 style={{ marginTop: 16 }}>Changed before</h4>
                <DatePicker
                    onSelect={(value) => {
                        setChangedBefore(value);
                    }}
                    onChange={(value) => {
                        setChangedBefore(value);
                    }}
                    placeholder="Select date"
                    style={{ width: "100%" }}
                    defaultValue={changedBefore}
                />
            </div>
        </div>
    );
}