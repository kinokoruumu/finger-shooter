import { cn } from "@/lib/utils";

type Props = {
	videoRef: React.RefObject<HTMLVideoElement | null>;
	isVisible: boolean;
};

export const CameraView = ({ videoRef, isVisible }: Props) => {
	return (
		<video
			ref={videoRef}
			className={cn(
				"absolute inset-0 h-full w-full object-cover",
				isVisible ? "opacity-100" : "pointer-events-none opacity-0",
			)}
			style={{ transform: "scaleX(-1)" }}
			playsInline
			muted
		/>
	);
};
