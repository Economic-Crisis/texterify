import {
    FileTextOutlined,
    HomeOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    ToolOutlined,
    UserOutlined
} from "@ant-design/icons";
import { Layout, Menu } from "antd";
import { CollapseType } from "antd/lib/layout/Sider";
import { observer } from "mobx-react";
import * as React from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { Routes } from "../../routing/Routes";
import { dashboardStore } from "../../stores/DashboardStore";
import { SidebarTrigger } from "../../ui/SidebarTrigger";
import { IS_CLOUD } from "../../utilities/Env";
const { Sider } = Layout;

interface INavigationData {
    icon: any;
    path: string;
    text: string;
    dataId: string;
    instanceOnly: boolean;
}

type IProps = RouteComponentProps<{}>;

@observer
class InstanceSidebar extends React.Component<IProps> {
    navigationData: INavigationData[] = [
        {
            icon: HomeOutlined,
            path: Routes.DASHBOARD.INSTANCE.ROOT,
            text: "Home",
            dataId: "instance-sidebar-home",
            instanceOnly: false
        },
        {
            icon: FileTextOutlined,
            path: Routes.DASHBOARD.INSTANCE.LICENSES,
            text: "Licenses",
            dataId: "instance-sidebar-licenses",
            instanceOnly: false
            // For now also shown in the cloud version because the tests are otherwise not working.
            // instanceOnly: true
        },
        {
            icon: UserOutlined,
            path: Routes.DASHBOARD.INSTANCE.USERS,
            text: "Users",
            dataId: "instance-sidebar-users",
            instanceOnly: false
        },
        {
            icon: ToolOutlined,
            path: Routes.DASHBOARD.INSTANCE.SETTINGS,
            text: "Settings",
            dataId: "instance-sidebar-settings",
            instanceOnly: false
        }
    ];

    getFilteredNavigationData = () => {
        return this.navigationData.filter((data) => {
            if (data.instanceOnly) {
                if (IS_CLOUD) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return true;
            }
        });
    };

    renderMenuItems = () => {
        return this.getFilteredNavigationData().map((data: INavigationData, index: number) => {
            return (
                <Menu.Item data-id={data.dataId} key={index} title={data.text}>
                    <Link to={data.path}>
                        <data.icon />
                        <span>{data.text}</span>
                    </Link>
                </Menu.Item>
            );
        });
    };

    getSelectedItems = () => {
        return this.getFilteredNavigationData().map((data: INavigationData, index: number): string => {
            if (data.path === this.props.location.pathname) {
                return index.toString();
            }
        });
    };

    onCollapse = (collapsed: boolean, type: CollapseType) => {
        if (type === "clickTrigger") {
            dashboardStore.sidebarMinimized = collapsed;
        }

        // Fix sidebar somehow not collapsing correctly.
        if (collapsed) {
            const sidebarMenu = document.getElementById("sidebar-menu");
            setTimeout(() => {
                if (sidebarMenu) {
                    sidebarMenu.classList.remove("ant-menu-inline");
                    sidebarMenu.classList.add("ant-menu-vertical");

                    const menuItems = sidebarMenu.querySelectorAll(".ant-menu-item") as unknown as HTMLElement[];
                    menuItems.forEach((menuItem) => {
                        menuItem.style.removeProperty("padding-left");
                    });

                    const submenuItems = sidebarMenu.querySelectorAll(
                        ".ant-menu-submenu .ant-menu-submenu-title"
                    ) as unknown as HTMLElement[];
                    submenuItems.forEach((submenuItem) => {
                        submenuItem.style.removeProperty("padding-left");
                    });
                }
            });
        }
    };

    renderSidebarTrigger = () => {
        return (
            <SidebarTrigger>
                {dashboardStore.sidebarMinimized ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </SidebarTrigger>
        );
    };

    render() {
        return (
            <>
                <Sider
                    collapsible
                    breakpoint="md"
                    defaultCollapsed={dashboardStore.sidebarMinimized}
                    collapsed={dashboardStore.sidebarMinimized}
                    onCollapse={this.onCollapse}
                    trigger={this.renderSidebarTrigger()}
                    style={{ boxShadow: "rgba(0, 0, 0, 0.05) 0px 0px 24px" }}
                >
                    <Menu
                        id="sidebar-menu"
                        mode="inline"
                        selectedKeys={this.getSelectedItems()}
                        style={{ height: "100%", paddingTop: 8 }}
                    >
                        {this.renderMenuItems()}
                    </Menu>
                </Sider>
            </>
        );
    }
}

export { InstanceSidebar };
