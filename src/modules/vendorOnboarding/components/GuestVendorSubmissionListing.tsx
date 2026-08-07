import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { GuestAxios } from "../../../services/GuestAxios";

type VendorOnboardingSummary = {
  id: string;
  referenceNumber: string;
  vendorName: string | null;
  status: string;
  vendorSubmittedAt: string | null;
  created_at: string;
};

export default function VendorSubmissionsListingPage() {
  const [onboardings, setOnboardings] = useState<VendorOnboardingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOnboardings = async () => {
      try {
        const { data } = await GuestAxios.get("/vendor-onboarding/guest");
        setOnboardings(data.onboardings);
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardings();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (onboardings.length === 0) {
    return <p>You don't have any onboarding submissions yet.</p>;
  }

  return (
    <table className="guest-listing-table">
      <thead>
        <tr>
          <th>Reference No.</th>
          <th>Vendor Name</th>
          <th>Status</th>
          <th>Submitted</th>
        </tr>
      </thead>
      <tbody>
        {onboardings.map((onboarding) => (
          <tr key={onboarding.id}>
            <td>
              <Link to={`/guest/vendor-onboarding/guest/${onboarding.id}`}>
                {onboarding.referenceNumber}
              </Link>
            </td>
            <td>{onboarding.vendorName ?? "—"}</td>
            <td>{onboarding.status}</td>
            <td>
              {onboarding.vendorSubmittedAt
                ? new Date(onboarding.vendorSubmittedAt).toLocaleDateString()
                : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
