import { AuthLayout } from "../../../layout/AuthLayout";
import ForgotPasswordForm from "../authforms/ForgotPasswordForm";

export const ForgotPasswordPage = () => {
	return (
		<AuthLayout
			eyebrow="Account recovery"
			title="Restore secure access"
			description="Recover access to your enterprise account through your registered business email address."
		>
			<ForgotPasswordForm />
		</AuthLayout>
	);
};
