import MainContentWrapper from "../../layout/MainContentWrapper";
import { marketingSidebar } from "../../sidebar/marketing.sidebar";

export default function MarketingLayout() {
	return <MainContentWrapper sidebarItems={marketingSidebar} />;
}
