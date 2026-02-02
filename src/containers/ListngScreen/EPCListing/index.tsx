import AppLayout from "../layouts/Applayout";
import EPCTable from "./EPCTable";
import { EPFProvider } from "../context/EPCcontext";

export default function EPCList() {
  return (
    <EPFProvider>
      <AppLayout>
        <div className="space-y-4">
          <EPCTable />
        </div>
      </AppLayout>
    </EPFProvider>
  );
}
