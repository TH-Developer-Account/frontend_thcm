import { useAuth } from "../../context/Auth/AuthContext";
import { formatDateTime } from "../../utils/format";
import ActionCard from "./components/Card";
import { actions } from "./constant";
import type { HomeActionAccess } from "./constant";

export default function HomeScreen() {
  const { canReadApp, canAccessAdministration, accessibleApps } = useAuth();

  const isVisible = (access: HomeActionAccess): boolean => {
    switch (access.kind) {
      case "everyone":
        return true;
      case "administration":
        return canAccessAdministration;
      case "app":
        return canReadApp(access.appKey);
    }
  };

  const findAppId = (access: HomeActionAccess): string =>
    access.kind === "app"
      ? (accessibleApps.find((app) => app.appKey === access.appKey)?.appId ??
        "")
      : "";

  const visibleActions = actions.filter((action) => isVisible(action.access));

  return (
    <div className="home-screen">
      <div className="home-subheader">
        <div className="home-subheader-content">
          <span className="home-eyebrow">Module Selector</span>

          <span className="home-meta">{formatDateTime(new Date())}</span>
        </div>
      </div>

      <div className="home-main">
        <section
          className="home-module-section"
          aria-label="Available applications"
        >
          {visibleActions.length > 0 ? (
            <div className="action-card-grid">
              {visibleActions.map((action) => {
                const Icon = action.icon;

                return (
                  <ActionCard
                    key={action.title}
                    appId={findAppId(action.access)}
                    description={action.description}
                    icon={
                      <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                    }
                    isActive={action.isActive}
                    path={action.path}
                    title={action.title}
                  />
                );
              })}
            </div>
          ) : (
            <div className="home-empty-state" role="status">
              <p className="home-empty-title">No applications available</p>

              <p className="home-empty-description">
                You currently do not have access to any application modules.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
