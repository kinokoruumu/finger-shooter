import {
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { UICatalog } from "./pages/ui-catalog.tsx";
import "./index.css";

const rootRoute = createRootRoute();

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: App,
});

const uiRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/ui",
	component: UICatalog,
});

const routeTree = rootRoute.addChildren([indexRoute, uiRoute]);
const router = createRouter({ routeTree });

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>,
);
