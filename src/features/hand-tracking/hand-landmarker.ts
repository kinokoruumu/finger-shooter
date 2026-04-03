import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let handLandmarker: HandLandmarker | null = null;

export const initHandLandmarker = async (): Promise<HandLandmarker> => {
	if (handLandmarker) return handLandmarker;

	const vision = await FilesetResolver.forVisionTasks(
		"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
	);

	handLandmarker = await HandLandmarker.createFromOptions(vision, {
		baseOptions: {
			modelAssetPath: "/models/hand_landmarker.task",
			delegate: "GPU",
		},
		runningMode: "VIDEO",
		numHands: 1,
	});

	return handLandmarker;
};

export const getHandLandmarker = () => handLandmarker;
