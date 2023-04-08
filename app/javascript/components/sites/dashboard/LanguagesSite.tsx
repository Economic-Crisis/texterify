import { CrownOutlined } from "@ant-design/icons";
import { LanguageIcon } from "@heroicons/react/24/outline";
import { Button, Empty, Input, Layout, Modal, Table } from "antd";
import { TableRowSelection } from "antd/lib/table/interface";
import * as _ from "lodash";
import * as React from "react";
import { RouteComponentProps } from "react-router-dom";
import { APIUtils } from "../../api/v1/APIUtils";
import { IGetLanguagesOptions, IGetLanguagesResponse, ILanguage, LanguagesAPI } from "../../api/v1/LanguagesAPI";
import { AddEditLanguageFormModal } from "../../forms/AddEditLanguageFormModal";
import { dashboardStore } from "../../stores/DashboardStore";
import { Breadcrumbs } from "../../ui/Breadcrumbs";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../ui/Config";
import FlagIcon from "../../ui/FlagIcons";
import { SiteHeader } from "../../ui/SiteHeader";
import { PermissionUtils } from "../../utilities/PermissionUtils";
import { t } from "../../i18n/Util";

type IProps = RouteComponentProps<{ projectId: string }>;
interface IState {
    languages: ILanguage[];
    selectedRowLanguages: any[];
    isDeleting: boolean;
    deleteDialogVisible: boolean;
    languagesResponse: IGetLanguagesResponse;
    addDialogVisible: boolean;
    perPage: number;
    page: number;
    search: string;
    languagesLoading: boolean;
    languageToEdit: ILanguage;
}

interface ITableRow {
    key: string;
    default: React.ReactNode;
    name: string;
    countryCode: React.ReactNode;
    languageCode: string;
    controls: React.ReactNode;
}

class LanguagesSite extends React.Component<IProps, IState> {
    state: IState = {
        languages: [],
        selectedRowLanguages: [],
        isDeleting: false,
        deleteDialogVisible: false,
        addDialogVisible: false,
        languagesResponse: null,
        search: "",
        page: 1,
        perPage: DEFAULT_PAGE_SIZE,
        languagesLoading: false,
        languageToEdit: null
    };

    debouncedSearchReloader = _.debounce(
        async (value) => {
            this.setState({ search: value, page: 1 });
            await this.reloadTable({ search: value, page: 1 });
        },
        500,
        { trailing: true }
    );

    rowSelection: TableRowSelection<ITableRow> = {
        onChange: (selectedRowLanguages, _selectedRows) => {
            this.setState({
                selectedRowLanguages: selectedRowLanguages
            });
        },
        getCheckboxProps: () => {
            return {
                disabled: !PermissionUtils.isDeveloperOrHigher(dashboardStore.getCurrentRole())
            };
        }
    };

    async componentDidMount() {
        this.reloadTable();
    }

    fetchLanguages = async (options?: IGetLanguagesOptions) => {
        this.setState({ languagesLoading: true });
        try {
            const responseLanguages = await LanguagesAPI.getLanguages(this.props.match.params.projectId, options);
            this.setState({
                languagesResponse: responseLanguages,
                languages: responseLanguages.data
            });
        } catch (err) {
            console.error(err);
        }
        this.setState({ languagesLoading: false });
    };

    reloadTable = async (options: IGetLanguagesOptions = {}) => {
        const fetchOptions = options || {};
        fetchOptions.search = options.search !== undefined ? options.search : this.state.search;
        fetchOptions.page = options.page !== undefined ? options.page : this.state.page;
        fetchOptions.perPage = options.perPage !== undefined ? options.perPage : this.state.perPage;
        await this.fetchLanguages(fetchOptions);
    };

    getColumns = () => {
        const columns: any[] = [
            {
                title: "Default",
                dataIndex: "default",
                key: "default",
                width: 40
            },
            {
                title: "Country code",
                dataIndex: "countryCode",
                key: "countryCode",
                width: 200
            },
            {
                title: "Language code",
                dataIndex: "languageCode",
                key: "languageCode",
                width: 200
            },
            {
                title: "Name",
                dataIndex: "name",
                key: "name"
                // defaultSortOrder: "ascend",
                // sorter: (a, b) => {
                //     return sortStrings(a.name, b.name, true);
                // }
            }
        ];

        if (PermissionUtils.isDeveloperOrHigher(dashboardStore.getCurrentRole())) {
            columns.push({
                title: "",
                dataIndex: "controls",
                width: 50
            });
        }

        return columns;
    };

    onEditLanguageClick = (language: ILanguage) => {
        this.setState({ addDialogVisible: true, languageToEdit: language });
    };

    getRows = () => {
        if (!this.state.languages) {
            return [];
        }

        return this.state.languages.map((language) => {
            const countryCode = APIUtils.getIncludedObject(
                language.relationships.country_code.data,
                this.state.languagesResponse.included
            );

            const languageCode = APIUtils.getIncludedObject(
                language.relationships.language_code.data,
                this.state.languagesResponse.included
            );

            return {
                key: language.attributes.id,
                default: language.attributes.is_default ? (
                    <div style={{ textAlign: "center" }}>
                        <CrownOutlined style={{ color: "#d6ad13", fontSize: 16 }} />
                    </div>
                ) : null,
                name: language.attributes.name,
                countryCode: countryCode ? (
                    <span>
                        <FlagIcon code={countryCode.attributes.code.toLowerCase()} />
                        <span style={{ marginLeft: 8 }}>{countryCode.attributes.code}</span>
                    </span>
                ) : (
                    ""
                ),
                languageCode: languageCode ? languageCode.attributes.code : "",
                controls: (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <Button
                            onClick={() => {
                                this.onEditLanguageClick(language);
                            }}
                        >
                            Edit
                        </Button>
                    </div>
                )
            };
        }, []);
    };

    onDeleteLanguages = async () => {
        this.setState({
            isDeleting: true,
            deleteDialogVisible: true
        });
        Modal.confirm({
            title: "Do you really want to delete this language?",
            content: "This cannot be undone and all translations for this language will also be deleted.",
            okText: "Yes",
            okButtonProps: {
                danger: true
            },
            cancelText: "No",
            autoFocusButton: "cancel",
            visible: this.state.deleteDialogVisible,
            onOk: async () => {
                const response = await LanguagesAPI.deleteLanguages(
                    this.props.match.params.projectId,
                    this.state.selectedRowLanguages
                );
                if (response.errors) {
                    return;
                }

                await this.reloadTable();

                await dashboardStore.loadProject(this.props.match.params.projectId);

                this.setState({
                    isDeleting: false,
                    deleteDialogVisible: false,
                    selectedRowLanguages: []
                });

                this.rowSelection.selectedRowKeys = [];
            },
            onCancel: () => {
                this.setState({
                    isDeleting: false,
                    deleteDialogVisible: false
                });
            }
        });
    };

    onSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.debouncedSearchReloader(event.target.value);
    };

    render() {
        this.rowSelection.selectedRowKeys = this.state.selectedRowLanguages;

        return (
            <>
                <Layout style={{ padding: "0 24px 24px", margin: "0", width: "100%" }}>
                    <Breadcrumbs breadcrumbName="languages" />
                    <Layout.Content style={{ margin: "24px 16px 0", minHeight: 360 }}>
                        <SiteHeader icon={<LanguageIcon />} title={t("component.languages_site.title")} />

                        <div style={{ display: "flex" }}>
                            <div style={{ flexGrow: 1 }}>
                                <Button
                                    type="default"
                                    style={{ marginRight: 10 }}
                                    onClick={() => {
                                        this.setState({ addDialogVisible: true });
                                    }}
                                    disabled={!PermissionUtils.isDeveloperOrHigher(dashboardStore.getCurrentRole())}
                                >
                                    Create language
                                </Button>
                                <Button
                                    danger
                                    onClick={this.onDeleteLanguages}
                                    disabled={
                                        this.state.selectedRowLanguages.length === 0 ||
                                        !PermissionUtils.isDeveloperOrHigher(dashboardStore.getCurrentRole())
                                    }
                                    loading={this.state.isDeleting}
                                    data-id="languages-delete-selected"
                                >
                                    Delete selected
                                </Button>
                            </div>
                            <Input.Search
                                placeholder="Search languages by name"
                                onChange={this.onSearch}
                                style={{ maxWidth: "50%" }}
                                data-id="project-languages-search"
                                allowClear
                            />
                        </div>
                        <Table
                            rowSelection={this.rowSelection}
                            dataSource={this.getRows()}
                            columns={this.getColumns()}
                            style={{ marginTop: 16 }}
                            bordered
                            loading={
                                this.state.languagesLoading ||
                                dashboardStore.currentProject.attributes.current_user_deactivated
                            }
                            pagination={{
                                pageSizeOptions: PAGE_SIZE_OPTIONS,
                                showSizeChanger: true,
                                current: this.state.page,
                                pageSize: this.state.perPage,
                                total: this.state.languagesResponse?.meta?.total || 0,
                                onChange: async (page: number, perPage: number) => {
                                    const isPageSizeChange = perPage !== this.state.perPage;

                                    if (isPageSizeChange) {
                                        this.setState({ page: 1, perPage: perPage });
                                        await this.reloadTable({ page: 1, perPage: perPage });
                                    } else {
                                        this.setState({ page: page, perPage: perPage });
                                        await this.reloadTable({ page: page, perPage: perPage });
                                    }
                                }
                            }}
                            locale={{
                                emptyText: (
                                    <Empty description="No languages found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                )
                            }}
                        />
                    </Layout.Content>
                </Layout>

                <AddEditLanguageFormModal
                    visible={this.state.addDialogVisible}
                    onCancelRequest={() => {
                        this.setState({
                            addDialogVisible: false,
                            languageToEdit: null
                        });
                    }}
                    languageFormProps={{
                        projectId: this.props.match.params.projectId,
                        languageToEdit: this.state.languageToEdit,

                        onSaved: async () => {
                            this.setState({
                                addDialogVisible: false,
                                languageToEdit: null
                            });

                            this.reloadTable();
                        }
                    }}
                />
            </>
        );
    }
}

export { LanguagesSite };
