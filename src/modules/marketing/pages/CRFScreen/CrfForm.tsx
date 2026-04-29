import React from "react";
import { useNavigate } from "react-router-dom";
import { buildLineItemPayload } from "../../constant";
import { useToast } from "../../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../../services/ServerAxios";
import LineItemTable from "../../../../components/ui/LineItemTable";
import type {
  CrfProps,
  Product,
  LineItemOption,
  GroupedOption,
} from "../../types";
import Button from "../../../../components/common/Button";
import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { ArrowLeft } from "lucide-react";

const CRF_CATEGORIES = [
  { title: "Printed Materials", value: "PRINTED_MATERIAL" },
  { title: "Souvenirs", value: "SOUVENIR" },
  { title: "Artworks", value: "ARTWORK" },
];

export function CrfItemsSection({
  items,
  onChange,
  isViewer,
  options,
}: CrfProps) {
  const getOptionsByCategory = (category: string): LineItemOption[] =>
    options.find((group) => group.label === category)?.options ?? [];

  const getItemsByCategory = (category: string) =>
    items.filter((item) => item.category === category);

  // ✅ Merge category-level changes back into the full flat array
  const handleCategoryChange = (
    category: string,
    updater: React.SetStateAction<LineItemOption[]>,
  ) => {
    onChange((prev) => {
      const otherItems = prev.filter((item) => item.category !== category);
      const categoryItems = prev.filter((item) => item.category === category);
      const updated =
        typeof updater === "function" ? updater(categoryItems) : updater;
      return [...otherItems, ...updated];
    });
  };

  return (
    <React.Fragment>
      {CRF_CATEGORIES.map((category) => (
        <LineItemTable
          key={category.value}
          title={category.title}
          items={getItemsByCategory(category.value)}
          onChange={(updater) => handleCategoryChange(category.value, updater)} // ✅
          particularOptions={getOptionsByCategory(category.value)}
          isViewer={isViewer}
          category={category.value}
        />
      ))}
    </React.Fragment>
  );
}

/* ------------------------------------------------------------------ */

export default function CrfForm() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [costItems, setCostItems] = React.useState<LineItemOption[]>([]);
  const [options, setOptions] = React.useState<GroupedOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  const stored = localStorage.getItem("epcInfo");
  const epcId: string | null = stored
    ? (JSON.parse(stored)?.epcId ?? null)
    : null;
  const crfId: string | null = stored
    ? (JSON.parse(stored)?.crfId ?? null)
    : null;

  React.useEffect(() => {
    const fetchAll = async () => {
      try {
        const productsRes = await ServerAxios.get(
          `/master-data/products?productType=CRF`,
        );

        // Build grouped options from products
        const products = productsRes.data.data as Product[];
        const grouped: GroupedOption[] = Object.values(
          products.reduce<Record<string, GroupedOption>>((acc, item) => {
            if (!acc[item.category])
              acc[item.category] = { label: item.category, options: [] };
            acc[item.category].options.push({
              value: item.id,
              label: item.name,
              particular: item.id,
              description: item.description,
              rate: parseFloat(item.unitRate),
              quantity: 1,
              partNumber: item.partNumber,
              category: item.category,
            });
            return acc;
          }, {}),
        );
        setOptions(grouped);
      } catch (err) {
        console.error("Fetch failed:", err);
        showToast({
          type: "error",
          title: "Error",
          description: "Failed to load data.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  React.useEffect(() => {
    const fetchCrf = async () => {
      try {
        const crfRes = await ServerAxios.get(`/crf/${crfId}`);

        if (crfId) {
          //   const allProducts = options.flatMap((g) => g.options);
          const lineItems: LineItemOption[] = (crfRes.data.lineItems ?? []).map(
            (item: {
              productId: string;
              productName: string;
              partNumber: string;
              description: string | null;
              rate: number;
              quantity: number;
              category: string;
              product: Product;
            }) => {
              console.log({ item });
              return {
                value: item.product.id,
                label: item.product.name,
                description: item.product.description,
                rate: item.rate,
                quantity: item.quantity,
                partNumber: item.product.partNumber,
                category: item.product.category,
              };
            },
          );
          setCostItems(lineItems);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
        showToast({
          type: "error",
          title: "Error",
          description: "Failed to load data.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (crfId) fetchCrf();
  }, [crfId]);

  const handleSubmit = async () => {
    try {
      if (!epcId) {
        console.error("EPC ID not found in localStorage");
        return;
      }
      const payload = buildLineItemPayload(costItems, { epcId });

      if (crfId) {
        const {
          data: { message },
        } = await ServerAxios.put(`/crf/${crfId}`, payload);
        showToast({ type: "success", title: "Success", description: message });
      } else {
        const {
          data: { message },
        } = await ServerAxios.post("/crf", payload);
        showToast({ type: "success", title: "Success", description: message });
        localStorage.removeItem("epcInfo");
      }

      navigate("/marketing/listing");
    } catch (error) {
      console.error("CRF save failed:", error);
      showToast({
        type: "error",
        title: "Error",
        description: "Failed to save CRF.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading CRF details...
      </div>
    );
  }
  return (
    <React.Fragment>
      <PageRowSectionLayout
        className=" scrollbar-sleek overflow-auto"
        stickyHeader
        header_children={
          <div className="flex flex-col sm:flex-row sm:justify-between items-end sm:items-center">
            <PageHeader
              headerText="Collateral Requisition Form (CRF)"
              subtitleText="Manage your Collateral Requisition Form (CRF) details here"
              Icon={ArrowLeft}
              badgeText="EPC Listing"
              path="/marketing/listing"
            />
            <div className="mx-2 my-4 sm:mx-4 flex flex-col gap-4 items-end">
              <p className="page-subtitle">
                <strong>EPC No: </strong>
                <span>{epcId}</span>
              </p>
              <div className="flex flex-row gap-4 items-end">
                <Button
                  text="Reset"
                  // onClick={() => handleReset()}
                  status="brand"
                />
                <Button
                  status="brand"
                  onClick={handleSubmit}
                  text={crfId ? "Update" : "Save"}
                  className="ml-2"
                />
              </div>
            </div>
          </div>
        }
      >
        <CrfItemsSection
          items={costItems}
          onChange={setCostItems}
          isViewer={false}
          options={options}
        />
      </PageRowSectionLayout>
    </React.Fragment>
  );
}
