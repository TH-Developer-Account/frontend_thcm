import { Megaphone, Box } from "lucide-react";
import Header from "./Header";
import ActionCard from "./components/Card";

export default function HomeScreen() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="flex items-center justify-center px-4 py-12 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 w-full max-w-4xl">
          <ActionCard
            icon={<Megaphone size={40} className="text-orange-500" />}
            title="Marketing Activity Planner"
            description="Streamline your campaigns and track performance."
            subText="Plan, execute, and analyze all your marketing efforts."
            path="/listing"
          />

          <ActionCard
            icon={<Box size={40} className="text-orange-500" />}
            title="Product Selector"
            description="Discover the perfect products for your needs."
            subText="Browse and compare features to make informed decisions."
            path="/listing"
          />
        </div>
      </main>
    </div>
  );
}
