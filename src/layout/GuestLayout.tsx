import { Outlet } from "react-router-dom";
import { useGuestAuth } from "../context/Auth/useGuestAuth";

export default function GuestLayout() {
  const { guest, logout } = useGuestAuth();
  console.log({ guest });

  return (
    <div className="guest-layout">
      <header className="guest-layout-header">
        <span className="guest-layout-brand">
          Tata Hitachi Construction Machinery
        </span>

        {guest ? (
          <div className="guest-layout-account">
            <span className="guest-layout-identity">
              {guest.email ?? guest.mobile}
            </span>
            <button type="button" className="auth-text-button" onClick={logout}>
              Log out
            </button>
          </div>
        ) : null}
      </header>

      <main className="guest-layout-content">
        <Outlet />
      </main>
    </div>
  );
}
