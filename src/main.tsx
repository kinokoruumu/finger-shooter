import {
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { lazy, StrictMode, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { CreatorPage } from "./pages/creator.tsx";
import { GamePage } from "./pages/game.tsx";
import "./index.css";

const UICatalog = lazy(() =>
	import("./pages/ui-catalog.tsx").then((m) => ({ default: m.UICatalog })),
);

// --- ルート定義 ---

const rootRoute = createRootRoute();

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
});

const creatorRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/creator",
});

const uiRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/ui",
});

const routeTree = rootRoute.addChildren([indexRoute, creatorRoute, uiRoute]);

export const router = createRouter({ routeTree });

// --- 描画 ---
// RouterProvider は使わない。
// RouterProvider 内部の state 遷移が Canvas の再マウントを引き起こし
// WebGL Context Lost が発生するため、router の状態を購読して
// 自前で描画する。ルーティングロジック（マッチ、ナビゲーション、型安全）
// は router インスタンス経由で利用可能。

const Root = () => {
	const [pathname, setPathname] = useState(router.state.location.pathname);

	useEffect(() => {
		return router.history.subscribe(() => {
			setPathname(router.state.location.pathname);
		});
	}, []);

	if (pathname === "/ui") {
		return (
			<Suspense fallback={null}>
				<UICatalog />
			</Suspense>
		);
	}
	if (pathname === "/creator") {
		return <CreatorPage />;
	}
	return <GamePage />;
};

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
	<StrictMode>
		<Root />
	</StrictMode>,
);
