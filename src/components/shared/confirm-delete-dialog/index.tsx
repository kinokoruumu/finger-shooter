import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	onConfirm: () => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const ConfirmDeleteDialog = ({
	open,
	onOpenChange,
	title,
	description,
	onConfirm,
}: Props) => {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="sm:max-w-sm">
				<AlertDialogHeader>
					<AlertDialogTitle style={rf}>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>キャンセル</AlertDialogCancel>
					<AlertDialogAction
						className="bg-red-600 hover:bg-red-700"
						onClick={onConfirm}
					>
						削除する
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
