import type { DealerAuditChecklist } from "../dealer-audit.types";

const makeItem = (
  id: string,
  code: string,
  sequence: number,
  categoryId: string,
  categoryName: string,
  title: string,
  description: string,
  parameter: string,
  criteria: string[],
) => ({
  id, code, sequence, categoryId, categoryName, title, description, parameter, criteria,
  status: "PENDING" as const, score: null, remarks: "", evidence: [],
});

export const CHECKLIST_LIBRARY: DealerAuditChecklist = {
  auditId: "demo-audit",
  dealerName: "ABC Motors",
  location: "Bangalore",
  categories: [
    {
      id: "sales-display",
      name: "Sales & Display",
      items: [
        makeItem("showroom-cleanliness", "SD-01", 1, "sales-display", "Sales & Display", "Showroom Cleanliness", "Clean, well maintained and free from dust and clutter.", "Overall cleanliness and housekeeping of showroom (floor, furniture, product display, reception area).", ["Floor and surfaces are clean", "No clutter or unwanted material", "Waste bins available and properly used", "Product display area is organized", "Reception area is tidy"]),
        makeItem("product-display", "SD-02", 2, "sales-display", "Sales & Display", "Product Display", "Proper display of products and materials.", "Products are displayed neatly and according to dealership standards.", ["Products are clean", "Display is organized", "Price/product information is visible"]),
        makeItem("signage-branding", "SD-03", 3, "sales-display", "Sales & Display", "Signage & Branding", "Branding elements are visible and correct.", "Dealer signage and brand assets follow approved standards.", ["External signage is visible", "Branding is current", "No damaged signage"]),
        makeItem("seating-reception", "SD-04", 4, "sales-display", "Sales & Display", "Seating & Reception", "Reception area is tidy and organized.", "Reception and customer seating areas are maintained for visitors.", ["Seating is clean", "Reception desk is organized", "Customer area is accessible"]),
        makeItem("lighting", "SD-05", 5, "sales-display", "Sales & Display", "Lighting", "Adequate lighting in showroom.", "Lighting provides adequate visibility throughout customer-facing areas.", ["No failed fixtures", "Display areas are illuminated", "Lighting is comfortable"]),
        makeItem("brochures", "SD-06", 6, "sales-display", "Sales & Display", "Brochures & Literature", "All relevant literature available.", "Current sales and product literature is available to customers.", ["Current brochures available", "Literature is organized", "Obsolete material removed"]),
      ],
    },
    {
      id: "staff-service", name: "Staff & Customer Service", items: [
        makeItem("staff-grooming", "SC-01", 7, "staff-service", "Staff & Customer Service", "Staff Grooming", "Staff presentation follows standards.", "Customer-facing staff maintain professional presentation.", ["Uniform/dress code followed", "Name identification visible", "Professional appearance"]),
        makeItem("customer-greeting", "SC-02", 8, "staff-service", "Staff & Customer Service", "Customer Greeting", "Customers are acknowledged promptly.", "Customers receive timely and professional assistance.", ["Prompt greeting", "Staff available", "Professional communication"]),
      ]
    },
    {
      id: "safety", name: "Safety & Compliance", items: [
        makeItem("fire-safety", "SF-01", 9, "safety", "Safety & Compliance", "Fire Safety", "Fire safety equipment is accessible.", "Required fire-safety controls are present and maintained.", ["Extinguishers accessible", "Exit route clear", "Safety signage visible"]),
      ]
    },
    {
      id: "facilities", name: "Facilities & Infrastructure", items: [
        makeItem("facility-condition", "FI-01", 10, "facilities", "Facilities & Infrastructure", "Facility Condition", "Facility is maintained and serviceable.", "Customer and operational facilities are maintained in usable condition.", ["No visible major damage", "Utilities functional", "Walkways clear"]),
      ]
    },
  ],
};
