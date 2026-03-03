import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-red-500">403</div>

        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          Access Forbidden
        </h1>

        <p className="mt-2 text-gray-600">
          You don’t have permission to view this resource. If you believe this
          is a mistake, contact your workspace admin.
        </p>

        <div className="mt-6 flex gap-3 justify-center">
          <Link
            to="/dashboard"
            className="px-5 py-2 rounded-xl bg-black text-white hover:opacity-90"
          >
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="px-5 py-2 rounded-xl border border-gray-300 hover:bg-gray-100"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
