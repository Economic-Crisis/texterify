import { LoadingOutlined } from "@ant-design/icons";
import { Button, Form, Input, List, message, Skeleton } from "antd";
import { observer } from "mobx-react";
import * as React from "react";
import { useParams } from "react-router";
import {
    IWordpressPolylangConnection,
    WordpressPolylangConnectionsAPI
} from "../../api/v1/WordpressPolylangConnectionsAPI";
import { Routes } from "../../routing/Routes";
import { Breadcrumbs } from "../../ui/Breadcrumbs";
import { ImportSidebar } from "../../ui/ImportSidebar";
import { LayoutWithSubSidebar } from "../../ui/LayoutWithSubSidebar";
import { LayoutWithSubSidebarInner } from "../../ui/LayoutWithSubSidebarInner";
import { LayoutWithSubSidebarInnerContent } from "../../ui/LayoutWithSubSidebarInnerContent";
import { OkIndicator } from "../../ui/OkIndicator";
import { WarningIndicator } from "../../ui/WarningIndicator";
import { SidebarWordpressIntegration } from "./SidebarWordpressIntegration";

interface IFormValues {
    wordpressURL: string;
    authUser: string;
    authPassword: string;
}

export const ProjectIntegrationsWordpressSettingsSite = observer(() => {
    const params = useParams<{ projectId: string }>();

    const [settingsLoading, setSettingsLoading] = React.useState<boolean>(true);
    const [settingsUpdating, setSettingsUpdating] = React.useState<boolean>(false);
    const [settings, setSettings] = React.useState<IWordpressPolylangConnection>();
    const [websiteReachableLoading, setWebsiteReachableLoading] = React.useState<boolean>(true);
    const [websiteReachable, setWebsiteReachable] = React.useState<boolean>();
    const [wordpressRestActivatedLoading, setWordpressRestActivatedLoading] = React.useState<boolean>(true);
    const [wordpressRestActivated, setWordpressRestActivated] = React.useState<boolean>();
    const [authenticationValidLoading, setAuthenticationValidLoading] = React.useState<boolean>(true);
    const [authenticationValid, setAuthenticationValid] = React.useState<boolean>();
    const [showPasswordField, setShowPasswordField] = React.useState<boolean>();

    async function loadWebsiteReachable() {
        try {
            setWebsiteReachableLoading(true);
            const response = await WordpressPolylangConnectionsAPI.websiteReachable({
                projectId: params.projectId
            });

            setWebsiteReachable(response === true);
            setWebsiteReachableLoading(false);
        } catch (error) {
            console.error(error);
            message.error("An unknown error occurred.");
        }
    }

    async function loadWordpressRestActivated() {
        try {
            setWordpressRestActivatedLoading(true);
            const response = await WordpressPolylangConnectionsAPI.wordpressRestActivated({
                projectId: params.projectId
            });

            setWordpressRestActivated(response === true);
            setWordpressRestActivatedLoading(false);
        } catch (error) {
            console.error(error);
            message.error("An unknown error occurred.");
        }
    }

    async function loadAuthenticationValid() {
        try {
            setAuthenticationValidLoading(true);
            const response = await WordpressPolylangConnectionsAPI.authenticationValid({
                projectId: params.projectId
            });

            setAuthenticationValid(response === true);
            setAuthenticationValidLoading(false);
        } catch (error) {
            console.error(error);
            message.error("An unknown error occurred.");
        }
    }

    React.useEffect(() => {
        Promise.all([
            (async () => {
                try {
                    setSettingsLoading(true);
                    const response = await WordpressPolylangConnectionsAPI.getConnection({
                        projectId: params.projectId
                    });

                    if (response && response.data) {
                        setSettings(response);
                        setShowPasswordField(!response.data.attributes.password_set);
                    }

                    setSettingsLoading(false);
                } catch (error) {
                    console.error(error);
                    message.error("An unknown error occurred.");
                }
            })(),
            loadWebsiteReachable(),
            loadWordpressRestActivated(),
            loadAuthenticationValid()
        ]);
    }, []);

    async function handleSubmit(values: IFormValues) {
        try {
            setSettingsUpdating(true);
            await WordpressPolylangConnectionsAPI.updateConnection({
                projectId: params.projectId,
                wordpressURL: values.wordpressURL,
                authUser: values.authUser,
                authPassword: values.authPassword
            });
            setSettingsUpdating(false);

            await Promise.all([loadWebsiteReachable(), loadWordpressRestActivated(), loadAuthenticationValid()]);
        } catch (error) {
            console.error(error);
            message.error("An unknown error occurred.");
        }
    }

    return (
        <LayoutWithSubSidebar>
            <ImportSidebar projectId={params.projectId} />

            <LayoutWithSubSidebarInner>
                <Breadcrumbs breadcrumbName="projectIntegrationsWordpressSettings" />
                <LayoutWithSubSidebarInnerContent>
                    <h1>WordPress Integration Settings</h1>
                    <p style={{ marginTop: 8, maxWidth: 800 }}>
                        With the WordPress integration you can sync your content with WordPress with ease.
                        {/* <br />
                        <br />
                        Check out the{" "}
                        <a href={Routes.OTHER.WORDPRESS_INTEGRATION_GUIDE} target="_blank">
                            WordPress integration documentation
                        </a>{" "}
                        for setup instructions. */}
                    </p>

                    <div style={{ display: "flex", marginTop: 40 }}>
                        {settingsLoading && (
                            <div style={{ width: "50%" }}>
                                <Skeleton />
                                <Skeleton />
                            </div>
                        )}
                        {!settingsLoading && (
                            <Form
                                id="wordpressPolylangSettingsForm"
                                onFinish={handleSubmit}
                                style={{ width: "50%", display: "flex", flexDirection: "column" }}
                                initialValues={{
                                    wordpressURL: settings?.data?.attributes.wordpress_url,
                                    authUser: settings?.data?.attributes.auth_user
                                }}
                            >
                                <h3>WordPress URL</h3>
                                <p>
                                    The URL to your WordPress website (e.g. <i>https://mywordpresswebsite.com</i>).
                                </p>
                                <Form.Item
                                    name="wordpressURL"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Please enter the URL of your WordPress website."
                                        }
                                    ]}
                                >
                                    <Input placeholder="Enter your WordPress website URL" />
                                </Form.Item>

                                <h3>Authentication</h3>
                                <h4>Username</h4>
                                <Form.Item
                                    name="authUser"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Please enter your username."
                                        }
                                    ]}
                                >
                                    <Input placeholder="Enter your username" />
                                </Form.Item>

                                <h4>Application password</h4>
                                <p>
                                    The application password you have created. Please read the{" "}
                                    <a href={Routes.OTHER.WORDPRESS_INTEGRATION_GUIDE} target="_blank">
                                        integration guide
                                    </a>{" "}
                                    to learn how to create an application password. <b>Don't</b> use the password you
                                    normally use for logging in to WordPress.
                                </p>
                                {!showPasswordField && (
                                    <a
                                        onClick={() => {
                                            setShowPasswordField(true);
                                        }}
                                    >
                                        Change password
                                    </a>
                                )}
                                {showPasswordField && (
                                    <Form.Item
                                        name="authPassword"
                                        rules={[
                                            {
                                                required: true,
                                                message: "Please enter your application password."
                                            }
                                        ]}
                                    >
                                        <Input.Password placeholder="Enter your application password" />
                                    </Form.Item>
                                )}

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={settingsUpdating}
                                    style={{ marginLeft: "auto" }}
                                >
                                    Save
                                </Button>
                            </Form>
                        )}

                        <div style={{ width: "50%", marginLeft: 80, display: "flex", flexDirection: "column" }}>
                            <h3>Integration status</h3>
                            <List
                                style={{ width: "100%" }}
                                bordered
                                dataSource={[
                                    {
                                        name: "Website reachable",
                                        valid: websiteReachable,
                                        loading: websiteReachableLoading
                                    },
                                    {
                                        name: "WordPress REST activated",
                                        valid: wordpressRestActivated,
                                        loading: wordpressRestActivatedLoading
                                    },
                                    {
                                        name: "Authentication valid",
                                        valid: authenticationValid,
                                        loading: authenticationValidLoading
                                    }
                                ]}
                                renderItem={(item) => {
                                    return (
                                        <List.Item>
                                            {item.name}

                                            <div
                                                style={{
                                                    marginLeft: 16,
                                                    display: "inline-block"
                                                }}
                                            >
                                                {item.valid && !item.loading && <OkIndicator />}

                                                {!item.valid && !item.loading && <WarningIndicator />}

                                                {item.loading && <LoadingOutlined />}
                                            </div>
                                        </List.Item>
                                    );
                                }}
                            />

                            <Button
                                type="primary"
                                onClick={async () => {
                                    Promise.all([
                                        loadWebsiteReachable(),
                                        loadWordpressRestActivated(),
                                        loadAuthenticationValid()
                                    ]);
                                }}
                                style={{ marginTop: 24, marginLeft: "auto" }}
                                loading={
                                    websiteReachableLoading ||
                                    wordpressRestActivatedLoading ||
                                    authenticationValidLoading
                                }
                            >
                                Check again
                            </Button>
                        </div>
                    </div>
                </LayoutWithSubSidebarInnerContent>
            </LayoutWithSubSidebarInner>
        </LayoutWithSubSidebar>
    );
});
