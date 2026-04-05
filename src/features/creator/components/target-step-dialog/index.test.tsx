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

	it("initialStepIndex + 的ありならアニメーションタブで開く", () => {
		const set = makeSet({
			targets: [
				{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
			],
			steps: [
				{ targetIds: ["t1"], interval: 100, startTime: 0 },
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

		expect(screen.getByText("+ ステップ追加")).toBeTruthy();
		expect(screen.getByText("ステップ 2")).toBeTruthy();
	});

	it("的が0個ならinitialStepIndex指定でも配置タブで開く", () => {
		const set = makeSet({
			steps: [
				{ targetIds: [], interval: 100, startTime: 0 },
			],
		});
		render(
			<TargetStepDialog
				{...defaultProps}
				group={makeGroup([set])}
				targetSet={set}
				initialStepIndex={0}
			/>,
		);

		expect(screen.getByTestId("editor-toolbar")).toBeTruthy();
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

	it("的ありのセット削除で確認ダイアログが出る", () => {
		const onUpdateGroup = vi.fn();
		const confirmMock = vi.fn().mockReturnValue(false);
		window.confirm = confirmMock;
		const set = makeSet({
			targets: [
				{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
			],
		});
		render(
			<TargetStepDialog
				{...defaultProps}
				group={makeGroup([set])}
				targetSet={set}
				onUpdateGroup={onUpdateGroup}
			/>,
		);

		fireEvent.click(screen.getByText("この的セットを削除"));

		expect(confirmMock).toHaveBeenCalledOnce();
		expect(onUpdateGroup).not.toHaveBeenCalled();
	});

	it("的なしのセット削除は確認なしで削除される", () => {
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

	it("ステップカード全体がクリック可能（アクティブ切替）", () => {
		const set = makeSet({
			targets: [
				{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
			],
			steps: [
				{ targetIds: ["t1"], interval: 100, startTime: 0 },
				{ targetIds: [], interval: 100, startTime: 500 },
			],
		});
		render(
			<TargetStepDialog
				{...defaultProps}
				group={makeGroup([set])}
				targetSet={set}
				initialStepIndex={0}
			/>,
		);

		// ステップ2のカードをクリック
		const step2Card = screen.getByText("ステップ 2").closest(
			"[class*='cursor-pointer']",
		);
		expect(step2Card).toBeTruthy();
		if (step2Card) fireEvent.click(step2Card);

		// ステップ2がアクティブ（border-amber-800）になっている
		expect(step2Card?.className).toContain("border-amber-800");
	});

	it("アニメーションタブのステップリストがスクロール可能", () => {
		const set = makeSet({
			targets: [
				{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
			],
			steps: Array.from({ length: 10 }, (_, i) => ({
				targetIds: i === 0 ? ["t1"] : [],
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
