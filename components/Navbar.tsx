'use client';

import { useSession, signOut } from 'next-auth/react';
import { Menu } from '@headlessui/react';
import Image from 'next/image';
import Link from 'next/link';

const Navbar = () => {
  const { data: session } = useSession();

  return (
    <nav className="w-full bg-pink-700 text-black px-4 py-4 flex justify-between items-center shadow-md">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Link href="/">
          <Image src="/yc-logo.png" alt="YC Directory" width={120} height={100} />
        </Link>
      </div>

      {/* Nav Links */}
      <ul className="flex gap-6 text-md font-medium items-center">
        <li><Link href="/create" className="hover:underline">Create</Link></li>
        <li><Link href="/startups" className="hover:underline">About</Link></li>

        {/* Avatar + Dropdown */}
        <li>
          <Menu as="div" className="relative">
            <Menu.Button>
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="avatar"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-white cursor-pointer"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold cursor-pointer">
                  U
                </div>
              )}
            </Menu.Button>

            <Menu.Items className="absolute right-3 mt-2 w-56 origin-top-right bg-amber-200 border border-pink-200 rounded-md shadow-lg focus:outline-none z-50">
              <div className="p-4 text-sm text-gray-800">
                {session?.user?.image && (
                  <Image
                    src={session.user.image}
                    alt="avatar"
                    width={60}
                    height={60}
                    className="rounded-full mx-auto mb-2"
                  />
                )}
                <p className="text-center font-semibold text-lg">{session?.user?.name}</p>
                <p className="text-center text-sm text-gray-500">{session?.user?.email}</p>
              </div>
              <hr className="my-1" />
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => signOut()}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      active ? 'bg-red-100 text-red-700' : 'text-gray-700'
                    }`}
                  >
                    Logout
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
