import { AuthLayout } from "../../../layout/AuthLayout";
import ResetPasswordForm from "../authforms/ResetPasswordForm";

export const ResetPasswordPage = () => {
	return (
		<AuthLayout
			eyebrow="Security control"
			title="Protect your operational access"
			description="Create a strong password that meets enterprise security requirements."
		>
			<ResetPasswordForm />
		</AuthLayout>
	);
};
