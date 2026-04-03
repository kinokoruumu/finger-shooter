import { cn } from "@/lib/utils";

type Props = {
	isVisible: boolean;
};

export const LoadingScreen = ({ isVisible }: Props) => {
	return (
		<div
			className={cn(
				"absolute inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500",
				isVisible ? "opacity-100" : "pointer-events-none opacity-0",
			)}
		>
			<h1 className="mb-8 font-bold text-4xl text-white">🔫 Finger Shooter</h1>
			<div className="flex flex-col items-center gap-4">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
				<p className="text-white/70 text-sm">
					カメラとハンドトラッキングを準備中...
				</p>
			</div>
		</div>
	);
};
