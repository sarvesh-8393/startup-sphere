'use client';

import { useSession, signOut } from 'next-auth/react';
import { Menu } from '@headlessui/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileId = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/founder-details?email=${session.user.email}`);
          const data = await response.json();
          if (data.profile && data.profile.id) {
            setProfileId(data.profile.id);
          }
        } catch (error) {
          console.error('Error fetching profile ID:', error);
        }
      }
    };

    fetchProfileId();
  }, [session]);

  const handleEditClick = () => {
    if (profileId) {
      router.push(`/founder-details/${profileId}`);
    } else {
      // Fallback to the original page if profile ID not found
      router.push('/founder-details');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-pink-700 text-black px-2 sm:px-4 py-2 sm:py-4 flex justify-between items-center shadow-md">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Link href="/">
          <span className="text-amber-400 font-bold text-xl">StartupSphere</span>
        </Link>
      </div>

      {/* Nav Links */}
      <ul className="flex gap-2 sm:gap-6 text-sm sm:text-md font-medium items-center">
        <li><Link href="/create" className="hover:underline">Create</Link></li>
        {/* <li><Link href="/dashboard" className="hover:underline">Dashboard</Link></li> */}

        <li><Link href="/about" className="hover:underline">About</Link></li>


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
                    onClick={handleEditClick}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      active ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    Edit
                  </button>
                )}
              </Menu.Item>
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
