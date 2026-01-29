// src/components/layout/Navbar.jsx
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between bg-orange-500 px-6 py-3 text-white">
      <h1 className="text-lg font-bold">TATA HITACHI</h1>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-orange-500"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
            SY
          </span>
          <span className="font-medium">Syed</span>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-40 rounded-md bg-white text-sm text-gray-700 shadow-lg">
            <button className="block w-full px-4 py-2 text-left hover:bg-gray-100">
              User Info
            </button>
            <button className="block w-full px-4 py-2 text-left hover:bg-gray-100">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
