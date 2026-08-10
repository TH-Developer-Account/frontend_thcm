import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GuestAxios } from "../../services/GuestAxios";

import Card from "../../components/common/Card";
import DataTable from "../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../components/ui/tables/Skeletons/DataTableSkeleton";
import { getVendorOnboardingColumns } from "../vendorOnboarding/utils/vendorOnboardingListing.columns";
import type { VendorOnboardingListingRow } from "../vendorOnboarding/types/vendorListing.types";

const SKELETON_ROW_COUNT = 8;

export default function VendorSubmissionsListingPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<VendorOnboardingListingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOnboardings = async () => {
      try {
        const { data } = await GuestAxios.get("/vendor-onboarding/guest");
        setRows(data.onboardings);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnboardings();
  }, []);

  const handleView = useCallback(
    (row: VendorOnboardingListingRow) => {
      navigate(`/guest/vendor-onboarding/guest/${row.id}`);
    },
    [navigate],
  );

  const columns = useMemo(
    () => getVendorOnboardingColumns({ onView: handleView }),
    [handleView],
  );

  return (
    <Card className="vendor-listing-card" title="Vendor Onboarding">
      <section className="vendor-listing-table" aria-busy={isLoading}>
        {isLoading ? (
          <DataTableSkeleton
            rows={SKELETON_ROW_COUNT}
            columns={columns.length}
            showPagination={false}
          />
        ) : (
          <DataTable<VendorOnboardingListingRow>
            data={rows}
            columns={columns}
            loading={false}
            manualPagination={false}
            scrollTargetId="guest-vendor-onboarding-table-scroll"
            emptyTitle="No submissions yet"
            emptyDescription="You don't have any vendor onboarding submissions yet."
          />
        )}
      </section>
    </Card>
  );
}
