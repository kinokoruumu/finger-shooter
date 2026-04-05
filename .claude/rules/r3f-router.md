# R3F + ルーター制約

## 絶対ルール: Canvas を RouterProvider の中に置かない

R3F の `<Canvas>` は unmount 時に `renderer.forceContextLoss()` を呼ぶ（仕様）。
ルーターライブラリ（TanStack Router, react-router 等）の Provider 内部で
state 遷移が走ると、子ツリーが再マウントされ Canvas が unmount → remount される。
結果として **WebGL Context Lost / 白フラッシュ** が発生する。

これはルーターの種類やバンドラー（Vite/webpack）に依らない。
React の reconciliation + R3F の unmount 挙動の組み合わせが原因。

### 参考 Issue

- [pmndrs/react-three-fiber#1270](https://github.com/pmndrs/react-three-fiber/issues/1270)
- [pmndrs/react-three-fiber#3176](https://github.com/pmndrs/react-three-fiber/issues/3176)

## 現在の構成

`RouterProvider` は使わず、`router` インスタンスの `history.subscribe` で
pathname を購読し、自前で描画を切り替えている。

```tsx
// main.tsx
export const router = createRouter({ routeTree });

const Root = () => {
  const [pathname, setPathname] = useState(router.state.location.pathname);
  useEffect(() => router.history.subscribe(() => {
    setPathname(router.state.location.pathname);
  }), []);

  if (pathname === "/creator") return <CreatorPage />;
  return <GamePage />;
};
```

- Canvas はどのルーター Provider の子にもならない → 再マウントなし
- `router.navigate()`, ルートマッチ, 型安全は `router` 経由で利用可能

## 試して効果がなかったもの

| 手法 | 結果 |
|---|---|
| `startTransition` で `notifyListeners` をラップ | ゲーム内 state 更新には効くが、ルーター自身の内部 state 遷移には効かない |
| `router.load()` でルート解決後にレンダリング | 効果なし。ルーターの内部 state 遷移は load 後にも発生する |
| `react-router` に変更 | 同じ問題が発生（ルーターの種類に依らない） |
| Canvas の `gl` オプション調整（`powerPreference`, `preserveDrawingBuffer` 等） | 効果なし |
