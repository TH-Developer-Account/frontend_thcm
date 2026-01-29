// src/components/ui/Card.jsx
export default function Card({ icon, title, description }) {
  return (
    <div className="w-80 rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg">
      <div className="mb-4 text-orange-500">{icon}</div>

      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}
