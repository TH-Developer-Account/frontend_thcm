// src/pages/Dashboard.jsx
import Navbar from "../components/layout/Navbar";
import Card from "../components/ui/Card";
import { Megaphone, Box } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="flex justify-center gap-8 p-10">
        <Card
          icon={<Megaphone size={40} />}
          title="Marketing Activity Planner"
          description="Streamline your campaigns and track performance. Plan, execute, and analyze all your marketing efforts."
        />

        <Card
          icon={<Box size={40} />}
          title="Product Selector"
          description="Discover the perfect products for your needs. Browse and compare features to make informed decisions."
        />
      </div>
    </div>
  );
}
