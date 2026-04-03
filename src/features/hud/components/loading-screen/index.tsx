import { cn } from "@/lib/utils";

type Props = {
	isVisible: boolean;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const LoadingScreen = ({ isVisible }: Props) => {
	return (
		<div
			className={cn(
				"absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#f5f0e8] transition-opacity duration-500",
				isVisible ? "opacity-100" : "pointer-events-none opacity-0",
			)}
		>
			<h1
				className="mb-8 font-black text-4xl tracking-tight text-amber-900"
				style={rf}
			>
				的あて
			</h1>
			<div className="flex flex-col items-center gap-4">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-900/20 border-t-amber-800" />
				<p className="font-medium text-amber-900/50 text-sm" style={rf}>
					カメラとハンドトラッキングを準備中...
				</p>
			</div>
		</div>
	);
};
