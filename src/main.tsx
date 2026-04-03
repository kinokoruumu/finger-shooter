import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./index.css";

const UICatalog = lazy(() =>
	import("./pages/ui-catalog.tsx").then((m) => ({ default: m.UICatalog })),
);

const isUICatalog = window.location.pathname === "/ui";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
	<StrictMode>
		{isUICatalog ? (
			<Suspense fallback={null}>
				<UICatalog />
			</Suspense>
		) : (
			<App />
		)}
	</StrictMode>,
);
