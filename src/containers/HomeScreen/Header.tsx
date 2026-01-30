import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Avatar from "../../components/common/Avatar";

function Header() {
  return (
    <header className="bg-orange-500 px-4 sm:px-8 py-3 flex items-center justify-between text-white">
      <span className="text-base sm:text-xl font-bold tracking-wide">
        TATA HITACHI
      </span>

      <div className="relative">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar
            firstName={"Syed"}
            lastName={"Fazal"}
            imageUrl={""}
            size="md"
          />
          <Menu as="div" className="relative inline-block">
            <MenuButton className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white inset-ring-1 inset-ring-white/5 hover:bg-white/20">
              Syed
              <ChevronDownIcon
                aria-hidden="true"
                className="-mr-1 size-5 text-gray-400"
              />
            </MenuButton>

            <MenuItems
              transition
              className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-white/10 rounded-md bg-white outline-1 -outline-offset-1 outline-white/10 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
            >
              <div className="py-1">
                <MenuItem>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-300 data-focus:bg-white/5 data-focus:text-white data-focus:outline-hidden"
                  >
                    User Info
                  </a>
                </MenuItem>
                <MenuItem>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-300 data-focus:bg-white/5 data-focus:text-white data-focus:outline-hidden"
                  >
                    Sign Out
                  </a>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </div>
        {/* 
        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-white text-gray-700 rounded-md shadow-lg text-sm z-50">
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
              User Info
            </button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
              Sign Out
            </button>
          </div>
        )} */}
      </div>
    </header>
  );
}

export default Header;
