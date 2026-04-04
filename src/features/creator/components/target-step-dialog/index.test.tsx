import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CreatorGroup, CreatorTargetSet } from "../../types";

// R3F の Canvas はテスト環境で動かないのでモック
vi.mock("../editor-canvas", () => ({
	EditorCanvasWrapper: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="canvas-wrapper">{children}</div>
	),
	EditorScene: () => <div data-testid="editor-scene" />,
}));

vi.mock("../editor-toolbar", () => ({
	EditorToolbar: () => <div data-testid="editor-toolbar" />,
}));

// モック後にインポート
const { TargetStepDialog } = await import(".");

afterEach(cleanup);

const makeSet = (
	partial: Partial<CreatorTargetSet> = {},
): CreatorTargetSet => ({
	id: "set1",
	targets: [],
	steps: [{ targetIds: [], interval: 100, startTime: 0 }],
	...partial,
});

const makeGroup = (
	sets: CreatorTargetSet[] = [makeSet()],
): CreatorGroup => ({
	id: "g1",
	targetSets: sets,
	balloonEntries: [],
	train: null,
	trainStartTime: null,
});

const defaultProps = {
	open: true,
	onClose: vi.fn(),
	onUpdateGroup: vi.fn(),
};

describe("TargetStepDialog", () => {
	it("ダイアログが開ける", () => {
		const set = makeSet();
		render(
			<TargetStepDialog
				{...defaultProps}
				group={makeGroup([set])}
				targetSet={set}
			/>,
		);

		expect(screen.getByText("的の編集")).toBeTruthy();
	});

	it("配置タブとアニメーションタブが切り替えられる", () => {
		const set = makeSet();
		render(
			<TargetStepDialog
				{...defaultProps}
				group={makeGroup([set])}
				targetSet={set}
			/>,
		);

		// 初期は配置タブ
		expect(screen.getByTestId("editor-toolbar")).toBeTruthy();

		// アニメーションタブに切り替え
		fireEvent.click(screen.getByText("アニメーション"));
		expect(screen.getByText("+ ステップ追加")).toBeTruthy();
	});

	it("initialStepIndex が指定されたらアニメーションタブで開く", () => {
		const set = makeSet({
			steps: [
				{ targetIds: [], interval: 100, startTime: 0 },
				{ targetIds: [], interval: 100, startTime: 500 },
			],
		});
		render(
			<TargetStepDialog
				{...defaultProps}
				group={makeGroup([set])}
				targetSet={set}
				initialStepIndex={1}
			/>,
		);

		// アニメーションタブが表示されている
		expect(screen.getByText("+ ステップ追加")).toBeTruthy();
		// ステップ2が存在する
		expect(screen.getByText("ステップ 2")).toBeTruthy();
	});

	it("ステップ追加で onUpdateGroup が呼ばれる", () => {
		const onUpdateGroup = vi.fn();
		const set = makeSet();
		render(
			<TargetStepDialog
				{...defaultProps}
				group={makeGroup([set])}
				targetSet={set}
				onUpdateGroup={onUpdateGroup}
			/>,
		);

		// アニメーションタブに切り替え
		fireEvent.click(screen.getByText("アニメーション"));
		// ステップ追加
		fireEvent.click(screen.getByText("+ ステップ追加"));

		expect(onUpdateGroup).toHaveBeenCalledOnce();
		const updatedGroup = onUpdateGroup.mock.calls[0][0];
		const updatedSet = updatedGroup.targetSets.find(
			(s: CreatorTargetSet) => s.id === "set1",
		);
		expect(updatedSet.steps).toHaveLength(2);
	});

	it("セット削除で onUpdateGroup が呼ばれダイアログが閉じる", () => {
		const onUpdateGroup = vi.fn();
		const onClose = vi.fn();
		const set = makeSet();
		render(
			<TargetStepDialog
				{...defaultProps}
				group={makeGroup([set])}
				targetSet={set}
				onUpdateGroup={onUpdateGroup}
				onClose={onClose}
			/>,
		);

		fireEvent.click(screen.getByText("この的セットを削除"));

		expect(onUpdateGroup).toHaveBeenCalledOnce();
		const updatedGroup = onUpdateGroup.mock.calls[0][0];
		expect(updatedGroup.targetSets).toHaveLength(0);
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("アニメーションタブのステップリストがスクロール可能", () => {
		const set = makeSet({
			steps: Array.from({ length: 10 }, (_, i) => ({
				targetIds: [],
				interval: 100,
				startTime: i * 500,
			})),
		});
		render(
			<TargetStepDialog
				{...defaultProps}
				group={makeGroup([set])}
				targetSet={set}
				initialStepIndex={0}
			/>,
		);

		// スクロール可能なコンテナが存在する
		const scrollContainer = screen.getByText("ステップ 1").closest(
			".overflow-y-auto",
		);
		expect(scrollContainer).toBeTruthy();
	});
});
