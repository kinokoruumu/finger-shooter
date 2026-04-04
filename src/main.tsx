import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { App } from "./App.tsx";
import "./index.css";

const UICatalog = lazy(() =>
	import("./pages/ui-catalog.tsx").then((m) => ({ default: m.UICatalog })),
);

const CreatorPage = lazy(() =>
	import("./pages/creator.tsx").then((m) => ({ default: m.CreatorPage })),
);

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
	<StrictMode>
		<BrowserRouter>
			<Suspense fallback={null}>
				<Routes>
					<Route path="/" element={<App />} />
					<Route path="/ui" element={<UICatalog />} />
					<Route path="/creator" element={<CreatorPage />} />
				</Routes>
			</Suspense>
		</BrowserRouter>
	</StrictMode>,
);
