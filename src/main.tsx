import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./index.css";

const UICatalog = lazy(() =>
	import("./pages/ui-catalog.tsx").then((m) => ({ default: m.UICatalog })),
);

const CreatorPage = lazy(() =>
	import("./pages/creator.tsx").then((m) => ({ default: m.CreatorPage })),
);

const path = window.location.pathname;

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const PageComponent = () => {
	if (path === "/ui") return <UICatalog />;
	if (path.startsWith("/creator")) return <CreatorPage />;
	return <App />;
};

createRoot(rootElement).render(
	<StrictMode>
		<Suspense fallback={null}>
			<PageComponent />
		</Suspense>
	</StrictMode>,
);
