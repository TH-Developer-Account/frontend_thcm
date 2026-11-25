import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <main className="forbidden-page">
      <div className="forbidden-card">
        <span className="forbidden-icon" aria-hidden="true">
          <ShieldAlert size={28} strokeWidth={1.75} />
        </span>

        <p className="forbidden-code">Error 403</p>

        <h1 className="forbidden-title">Access forbidden</h1>

        <p className="forbidden-description">
          You don’t have permission to view this resource. If you believe this
          is a mistake, contact your workspace admin.
        </p>

        <div className="forbidden-actions">
          <Link to="/dashboard" className="forbidden-action forbidden-action-primary">
            Go to Dashboard
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="forbidden-action forbidden-action-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
}
