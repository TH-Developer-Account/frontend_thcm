import { useMemo, useState } from "react";
import { ShieldMinus, ShieldPlus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import { SearchInput } from "../../../components/forms/SearchInput";
import SelectInput from "../../../components/forms/SelectInput";
import { FilterTabs } from "../../../components/ui/FilterTabs";
import { PageHeader } from "../../../components/ui/PageHeader";
import ManagementTable from "../../../components/ui/tables/ManagementTable/ManagementTable";
import { ManagementIdentityCell } from "../../../components/ui/tables/ManagementTable/ManagementTableCells";
import type { ManagementTableColumn } from "../../../components/ui/tables/ManagementTable/ManagementTable.types";
import { useToast } from "../../../context/Auth/AuthContext";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import {
  showApiErrorToast,
  showSuccessToast,
} from "../../../utils/apiError.helper";
import {
  accessApi,
  accessKeys,
  useManageableApps,
  type AppAdministrator,
} from "../access.api";
import { usePaginatedUsers } from "../users/usePaginatedUsers";

import type { User } from "../users/user-management.types";

type AdministratorTab = "all" | "administrators";

// One row shape for both tabs: a workspace user, plus their grant if any.
type AdministratorTableRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  administrator: AppAdministrator | null;
};

const ADMINISTRATORS_PAGE_SIZE = 10;
const NO_ADMINISTRATORS: AppAdministrator[] = [];

const toRowFromUser = (
  user: User,
  administratorsById: Map<string, AppAdministrator>,
): AdministratorTableRow => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email || null,
  administrator: administratorsById.get(user.id) ?? null,
});

const toRowFromAdministrator = (
  administrator: AppAdministrator,
): AdministratorTableRow => ({
  id: administrator.id,
  firstName: administrator.firstName,
  lastName: administrator.lastName,
  email: administrator.email,
  administrator,
});

const getFullName = (row: { firstName: string; lastName: string }) =>
  `${row.firstName} ${row.lastName}`.trim() || "--";

// The administrator list is small and unpaginated on the server, so its tab
// is searched in memory with the same box that drives the server search.
const matchesAdministratorSearch = (
  administrator: AppAdministrator,
  normalizedSearch: string,
) =>
  `${getFullName(administrator)} ${administrator.email ?? ""}`
    .toLowerCase()
    .includes(normalizedSearch);

const formatGrant = (administrator: AppAdministrator | null) =>
  administrator
    ? `${new Date(administrator.grantedAt).toLocaleDateString()} by ${getFullName(administrator.grantedBy)}`
    : "--";

// Super Admin only (guarded in adminRoutes): decides who administers each app.
const AppAdministratorsPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdministratorTab>("all");
  const [selectedAppKey, setSelectedAppKey] = useState("");

  const appsQuery = useManageableApps();
  const apps = appsQuery.data ?? [];
  const appKey = selectedAppKey || apps[0]?.appKey || "";
  const appOptions = apps.map((app) => ({
    label: app.appName,
    value: app.appKey,
  }));

  const administratorsQuery = useQuery({
    queryKey: accessKeys.administrators(appKey),
    queryFn: () => accessApi.listAdministrators(appKey),
    enabled: Boolean(appKey),
  });
  const administrators = administratorsQuery.data ?? NO_ADMINISTRATORS;

  const userList = usePaginatedUsers({
    enabled: activeTab === "all" && Boolean(appKey),
  });

  const rows = useMemo(() => {
    if (activeTab === "all") {
      const administratorsById = new Map(
        administrators.map((administrator) => [
          administrator.id,
          administrator,
        ]),
      );
      return userList.rows.map((user) =>
        toRowFromUser(user, administratorsById),
      );
    }

    const normalizedSearch = userList.search.trim().toLowerCase();
    return administrators
      .filter((administrator) =>
        matchesAdministratorSearch(administrator, normalizedSearch),
      )
      .map(toRowFromAdministrator);
  }, [activeTab, administrators, userList.rows, userList.search]);

  const onAccessChanged = async (response: { message: string }) => {
    await queryClient.invalidateQueries({
      queryKey: accessKeys.administrators(appKey),
    });
    showSuccessToast(showToast, response.message);
  };

  const grantMutation = useMutation({
    mutationFn: (userId: string) =>
      accessApi.grantAdministrator(appKey, userId),
    onSuccess: onAccessChanged,
    onError: (error) =>
      showApiErrorToast(
        showToast,
        error,
        "Failed to grant administrator access.",
      ),
  });

  const revokeMutation = useMutation({
    mutationFn: (userId: string) =>
      accessApi.revokeAdministrator(appKey, userId),
    onSuccess: onAccessChanged,
    onError: (error) =>
      showApiErrorToast(
        showToast,
        error,
        "Failed to revoke administrator access.",
      ),
  });

  const isMutating = grantMutation.isPending || revokeMutation.isPending;
  // mutate is referentially stable, unlike the mutation result objects.
  const grantAdministrator = grantMutation.mutate;
  const revokeAdministrator = revokeMutation.mutate;

  const columns = useMemo<ManagementTableColumn<AdministratorTableRow>[]>(
    () => [
      {
        key: "name",
        header: "Name",
        width: "22rem",
        render: (row) => (
          <ManagementIdentityCell
            title={getFullName(row)}
            subtitle={row.email ?? "--"}
            alt={getFullName(row)}
          />
        ),
      },
      {
        key: "access",
        header: "Access",
        width: "10rem",
        render: (row) =>
          row.administrator ? (
            <Badge variant="success">Administrator</Badge>
          ) : (
            "--"
          ),
      },
      {
        key: "granted",
        header: "Granted",
        width: "16rem",
        hideBelow: "md",
        render: (row) => formatGrant(row.administrator),
      },
      {
        key: "actions",
        header: "",
        width: "12rem",
        render: (row) =>
          row.administrator ? (
            <Button
              type="button"
              text="Revoke"
              Icon={ShieldMinus}
              iconSize={16}
              appearance="ghost"
              variant="secondary"
              size="sm"
              disabled={isMutating}
              onClick={() => revokeAdministrator(row.id)}
            />
          ) : (
            <Button
              type="button"
              text="Make administrator"
              Icon={ShieldPlus}
              iconSize={16}
              appearance="standard"
              variant="brand"
              size="sm"
              disabled={isMutating}
              onClick={() => grantAdministrator(row.id)}
            />
          ),
      },
    ],
    [grantAdministrator, revokeAdministrator, isMutating],
  );

  const tabItems = [
    {
      value: "all" as const,
      label: "All users",
      count: userList.tablePagination.totalRowCount,
      badgeVariant: "neutral" as const,
    },
    {
      value: "administrators" as const,
      label: "Administrators",
      count: administrators.length,
      badgeVariant: "success" as const,
    },
  ];

  const isAllUsersTab = activeTab === "all";
  const isLoading = isAllUsersTab
    ? userList.query.isLoading ||
      userList.query.isFetching ||
      administratorsQuery.isLoading
    : administratorsQuery.isLoading;

  return (
    <PageSectionLayout>
      <PageHeader
        headerText="App Administrators"
        navigation={{
          variant: "breadcrumbs",
          ariaLabel: "App administrators page location",
          breadcrumbs: [
            { label: "Home Screen", href: "/" },
            { label: "App Administrators" },
          ],
          separator: "›",
        }}
      />

      <section
        className="user-management-panel"
        aria-label="App administrators"
      >
        <FilterTabs
          id="app-administrator-tabs"
          ariaLabel="Administrator filter"
          items={tabItems}
          value={activeTab}
          onChange={setActiveTab}
          variant="underline"
        />

        <div className="user-management-toolbar">
          <div className="user-management-role-filter">
            <SelectInput
              inputId="administered-app"
              aria-label="Application"
              options={appOptions}
              value={
                appOptions.find((option) => option.value === appKey) ?? null
              }
              onChange={(option) => setSelectedAppKey(option?.value ?? "")}
              isLoading={appsQuery.isLoading}
              isSearchable={false}
            />
          </div>

          <div className="user-management-search">
            <SearchInput
              value={userList.search}
              onChange={userList.setSearch}
              placeholder="Search by name, email, phone or employee code..."
            />
          </div>
        </div>

        {/* Revoking keeps the person's own profiles (decision F): they
				    lose admin rights, not their app access. */}
        <p className="app-admin-hint">
          Revoking administrator rights does not remove the user&apos;s own
          profile in this app.
        </p>

        <ManagementTable<AdministratorTableRow>
          // Remount per tab: server paging and client paging keep
          // separate page state.
          key={activeTab}
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          ariaLabel="App administrators table"
          caption="Workspace users and their administrator access"
          minWidth="60rem"
          pagination
          {...(isAllUsersTab
            ? userList.tablePagination
            : { defaultPageSize: ADMINISTRATORS_PAGE_SIZE })}
          density="comfortable"
          loading={isLoading}
          loadingRowCount={6}
          emptyTitle={
            isAllUsersTab ? "No users found" : "No administrators yet"
          }
          emptyDescription={
            isAllUsersTab
              ? "No users match the search text."
              : "Only Super Admins can manage this app until someone is made administrator."
          }
        />
      </section>
    </PageSectionLayout>
  );
};

export default AppAdministratorsPage;
