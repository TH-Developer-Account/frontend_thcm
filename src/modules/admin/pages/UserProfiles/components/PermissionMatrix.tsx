import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { WorkspaceApp } from "../types/permission.types";
import type { PermissionState } from "../types/permission.types";

interface Props {
	apps: WorkspaceApp[];
	permissions: PermissionState;
	togglePerm: any;
	toggleModule: any;
	toggleApp: any;
}

const PermissionMatrix: React.FC<Props> = ({
	apps,
	permissions,
	togglePerm,
	toggleModule,
	toggleApp,
}) => {
	const [search, setSearch] = useState("");
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

	return (
		<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
			{/* SEARCH */}

			<input
				placeholder="Search modules..."
				className="w-full mb-4 bg-zinc-800 p-2 rounded"
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>

			{apps.map((app) => {
				const modules = app.modules.filter((m) =>
					m.name.toLowerCase().includes(search.toLowerCase()),
				);

				if (!modules.length) return null;

				return (
					<div key={app.key} className="mb-6">
						{/* APP HEADER */}

						<div
							className="flex items-center gap-3 font-semibold text-white cursor-pointer"
							onClick={() =>
								setCollapsed((p) => ({ ...p, [app.key]: !p[app.key] }))
							}
						>
							{collapsed[app.key] ? <ChevronRight /> : <ChevronDown />}

							<span>{app.name}</span>

							<button
								className="ml-auto text-xs text-orange-400"
								onClick={(e) => {
									e.stopPropagation();
									toggleApp(app.key);
								}}
							>
								Toggle All
							</button>
						</div>

						{!collapsed[app.key] && (
							<div className="mt-2 space-y-2">
								{modules.map((mod) => {
									const p = permissions[app.key][mod.key];

									return (
										<div
											key={mod.key}
											className="flex items-center justify-between bg-zinc-800 px-4 py-2 rounded"
										>
											<span>{mod.name}</span>

											<div className="flex gap-4">
												<label>
													<input
														type="checkbox"
														checked={p.read}
														onChange={() =>
															togglePerm(app.key, mod.key, "read")
														}
													/>
													Read
												</label>

												<label>
													<input
														type="checkbox"
														checked={p.write}
														onChange={() =>
															togglePerm(app.key, mod.key, "write")
														}
													/>
													Write
												</label>

												<button
													onClick={() => toggleModule(app.key, mod.key)}
													className="text-xs text-orange-400"
												>
													Toggle
												</button>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default PermissionMatrix;
