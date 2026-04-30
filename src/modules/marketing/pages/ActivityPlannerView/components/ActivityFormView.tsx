import React from "react";
import { ServerAxios } from "../../../../../services/ServerAxios";
import BudgetInfo from "./BudgetInfo";
import BudgetShare from "./BudgetShare";
import Participants from "./Participants";
import DateRange from "./DateRange";
import Section from "./Section";
import LineTableView from "./LineTableView";
import Loader from "../../../../../components/ui/Loader";
import type {
  EpcActiveWorkflow,
  EpcDetailResponse,
} from "../types/ActivityView.types";
import CommentsSection from "./CommentsSection";
import ApprovalTable, {
  type ApprovalRow,
} from "../../../../../components/ui/ApprovalTable";

interface Props {
  epcId?: string;
  epcData?: EpcDetailResponse;
}

const formatDate = (date?: string) => {
  if (!date) return "--";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const mapLineItems = (items: any[] = []) => {
  return items.map((item, index) => {
    const rate = Number(item.rate || item.amount || 0);
    const qty = Number(item.qty || item.quantity || 0);

    return {
      id: item.id,
      sno: index + 1,
      particulars:
        item.particulars ||
        item.item_name ||
        item.name ||
        item.product?.name || // ✅ FIX HERE
        "--",
      description:
        item.description ||
        item.product?.description || // ✅ FIX HERE
        "--",
      rate,
      qty,
      total: Number(item.total || rate * qty || 0),
    };
  });
};

const mapEpcWorkflowToApprovalRows = (
  workflow?: EpcActiveWorkflow | null,
): ApprovalRow[] => {
  if (!workflow) return [];

  return workflow.stages.flatMap((stage) =>
    stage.approvals.map((approval) => ({
      id: stage.stageOrder,
      name: `${approval.approver.first_name} ${approval.approver.last_name}`,
      email: approval.approver.email ?? "-",
      stageName: `Stage ${stage.stageOrder}`,
      strategy: stage.strategy,
      status: approval.status,
    })),
  );
};

const ActivityFormView = ({ epcId }: Props) => {
  const [epcData, setEPCData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const budget = JSON.parse(localStorage.getItem("budgetInfo") || "{}");

  const annualBudget = budget.annualBudget || 0;
  const availableBudget = budget.availableBudget || 0;
  const allotedBudget = budget.allotedBudget || 0;

  React.useEffect(() => {
    if (!epcId) return;

    const load = async () => {
      try {
        setLoading(true);
        const {
          data: { data },
        } = await ServerAxios.get(`/epc/${epcId}`);

        setEPCData(data);
      } catch (err) {
        console.log({ err });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [epcId]);

  if (loading) return <Loader />;
  if (!epcId) return <p>No EPC selected</p>;

  if (!epcData) return <p>EPC not found</p>;

  const viewData = epcData;

  const branchName =
    typeof viewData?.branch === "object"
      ? viewData?.branch?.branch_name
      : viewData?.branch;

  const departmentName =
    typeof viewData?.department === "object"
      ? viewData?.department?.department_name
      : viewData?.department;

  const verticalName =
    typeof viewData?.vertical === "object"
      ? viewData?.vertical?.name
      : viewData?.vertical;

  const regionName =
    typeof viewData?.region === "object"
      ? viewData?.region?.region_name
      : viewData?.region;

  const budgetValue =
    typeof viewData?.budget_master === "object"
      ? viewData?.budget_master?.value
      : viewData?.budget_master;

  const approvalRows = mapEpcWorkflowToApprovalRows(epcData?.activeWorkflow);

  return (
    <div className=" h-full min-h-screen max-w-5xl">
      <div className="w-full h-auto  mt-0 rounded-smounded-lg px-6 py-4">
        {/* Dates */}
        <DateRange
          fromDate={viewData?.event_from_date}
          toDate={viewData?.event_to_date}
        />
        <div className="form text-left my-3 text-sm ">
          <Section title="Activity Planner Details">
            <div className="grid grid-cols-4 gap-6 text-sm  p-3">
              <div>
                <span className="uppercase-label-text">Location</span>
                <br />
                {viewData?.location || "--"}
              </div>

              <div>
                <span className="uppercase-label-text">Branch</span>
                <br />
                {branchName || "--"}
              </div>

              <div>
                <span className="uppercase-label-text">Department</span>
                <br />
                {departmentName || "--"}
              </div>

              <div>
                <span className="uppercase-label-text">Vertical</span>
                <br />
                {verticalName || "--"}
              </div>

              <div>
                <span className="uppercase-label-text">Zone</span>
                <br />
                {regionName || "--"}
              </div>

              <div>
                <span className="uppercase-label-text">Created</span>
                <br />
                {formatDate(viewData?.created_at)}
              </div>

              <div>
                <span className="uppercase-label-text">Event Scale</span>
                <br />
                {viewData?.event_scale || "--"}
              </div>

              <div>
                <span className="uppercase-label-text">Budget</span>
                <br />
                {budgetValue || "--"}
              </div>
            </div>
          </Section>
          <Section title="Activity Planner Description">
            <div className="mb-6 border-b">
              <div className="flex flex-row justify-between">
                {/* Description */}
                <div className="mt-4 mb-4">
                  <p className="text-gray-700 leading-relaxed pl-3">
                    {viewData?.event_description || "--"}
                  </p>
                </div>

                <div className="mt-4 mb-4">
                  <p className="text-gray-700 leading-relaxed pl-3">
                    {viewData?.event_objective || "--"}
                  </p>
                </div>
              </div>
            </div>
          </Section>
          <Section title="Activity Proposition Form Line Items">
            {viewData?.epf?.lineItems?.length > 0 && (
              <LineTableView data={mapLineItems(viewData?.epf?.lineItems)} />
            )}
          </Section>
          <Section title="Collateral Requisition Form Line Items">
            {viewData?.crf?.lineItems?.length > 0 && (
              <LineTableView data={mapLineItems(viewData?.crf?.lineItems)} />
            )}
          </Section>
          <Section title="Activity Proposition Form Participants">
            <Participants
              internal={viewData?.epf?.internalParticipants}
              external={viewData?.epf?.externalParticipants}
            />
          </Section>
          <Section title="Activity Proposition Form Budget Information">
            <BudgetInfo
              annualBudget={annualBudget}
              availableBudget={availableBudget}
              eventBudget={viewData?.event}
              allotedBudget={allotedBudget}
            />
          </Section>
          <Section title="Activity Proposition Form Budget Share">
            <BudgetShare />
          </Section>
          <Section title="Comments">
            <CommentsSection
              workFlowId={epcData.activeWorkflow.id}
              stages={epcData.activeWorkflow.stages}
            />
          </Section>
          <Section title="Approval Flow">
            <ApprovalTable data={approvalRows} />
          </Section>
          <hr className="epf-divider mb-10 pb-12 mt-4 " />
        </div>
      </div>
    </div>
  );
};

export default ActivityFormView;
