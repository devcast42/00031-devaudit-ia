import type { ReactNode } from "react";
import { BrowserRouter, RouterProvider } from "react-router-dom";
import { router } from "./router";

type Props = {
    children?: ReactNode;
};

export function Providers({ children }: Props) {
    return (
        <BrowserRouter>
            <RouterProvider router={router} />
            {children}
        </BrowserRouter>
    );
}
