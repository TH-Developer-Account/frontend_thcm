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

export function CrfProps({ items, onChange, isViewer, options }: CrfProps) {
  const getOptionsByCategory = (category: string): LineItemOption[] => {
    return options.find((group) => group.label === category)?.options ?? [];
  };

  const getItemsByCategory = (category: string) => {
    return items.filter((item) => item.category === category);
  };

  return (
    <React.Fragment>
      <LineItemTable
        title="Printed Materials"
        items={getItemsByCategory("PRINTED_MATERIAL")}
        onChange={onChange}
        particularOptions={getOptionsByCategory("PRINTED_MATERIAL")}
        isViewer={isViewer}
        category="PRINTED_MATERIAL"
      />
      <LineItemTable
        title="Souveniers"
        items={getItemsByCategory("SOUVENIR")}
        onChange={onChange}
        particularOptions={getOptionsByCategory("SOUVENIR")}
        isViewer={isViewer}
        category="SOUVENIR"
      />
      <LineItemTable
        title="Artworks"
        items={getItemsByCategory("ARTWORK")}
        onChange={onChange}
        particularOptions={getOptionsByCategory("ARTWORK")}
        isViewer={isViewer}
        category="ARTWORK"
      />
    </React.Fragment>
  );
}

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */

export default function CrfForm() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [costItems, setCostItems] = React.useState<LineItemOption[]>([]);
  const [options, setOptions] = React.useState<GroupedOption[]>([]);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await ServerAxios.get(
          `/master-data/products?productType=CRF`,
        );

        const data = response.data.data as Product[];

        const groupedOptions: GroupedOption[] = Object.values(
          data.reduce<Record<string, GroupedOption>>((acc, item: Product) => {
            const category = item.category;

            if (!acc[category]) {
              acc[category] = {
                label: category,
                options: [],
              };
            }

            acc[category].options.push({
              value: item.id,
              label: item.name,
              particular: item.name,
              description: item.description,
              rate: parseFloat(item.unitRate),
              quantity: 1,
            });

            return acc;
          }, {}),
        );

        setOptions(groupedOptions);
      } catch (err) {
        console.error("Product search failed:", err);
        setOptions([]);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async () => {
    try {
      const epcId = localStorage.getItem("epcId");
      if (!epcId) {
        console.error("EPC ID not found in localStorage");
        return;
      }
      const payload = buildLineItemPayload(costItems, { epcId });

      console.log("FINAL PAYLOAD:", payload);

      const {
        data: { message },
      } = await ServerAxios.post("/crf", payload);

      showToast({
        type: "success",
        title: "Success",
        description: message,
      });

      navigate("/marketing/listing");
    } catch (error) {
      console.error("CRF creation failed:", error);
    }
  };

  console.log("CRF options:", options);

  return (
    <React.Fragment>
      <Button
        className="bg-blue-500 hover:bg-blue-600 text-white"
        onClick={handleSubmit}
      >
        Log CRF Items
      </Button>
      <CrfProps
        items={costItems}
        onChange={setCostItems}
        isViewer={false}
        options={options}
      />
    </React.Fragment>
  );
}
