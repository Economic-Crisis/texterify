import * as React from "react";

export function CustomModalFooterWrapper(props: { children: React.ReactNode }) {
    return <div style={{ margin: "6px 0" }}>{props.children}</div>;
}
