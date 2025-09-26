'use client';

import React from 'react';
import { EyeIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export interface Startup {
  id: string;
  slug: string;
  created_at: string;
  views: number | null;
  image_url: string | null;
  name: string;
  founder_id: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
  description: string;
  tags: string[];
}

interface Props {
  startups: Startup[];
}

const StartupCard: React.FC<Props> = ({ startups }) => {
  const router = useRouter();

  return (
    <div className="flex justify-center items-start px-4">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {startups.map((items: Startup) => (
          <li
            key={items.id}
            onClick={() => router.push(`/startup/${items.slug}`)}
            className="list-none cursor-pointer min-h-[530px] w-full border border-gray-200 bg-amber-50 rounded-xl p-5 flex flex-col items-center shadow-md transition-all duration-300 hover:border-b-4 hover:border-r-4 hover:border-pink-600 hover:bg-pink-100 group"
          >
            {/* Date and Views */}
            <div className="w-full flex justify-between text-gray-600">
              <p className="text-lg">
                {new Date(items.created_at).toLocaleDateString('en-us', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <div className="flex items-center gap-1 text-gray-700">
                <EyeIcon className="h-5 w-5 text-amber-500" />
                <p className="font-semibold">{items.views ?? 0}</p>
              </div>
            </div>

            <div className="mt-3 flex h-[200px] w-full overflow-hidden rounded-xl justify-center items-center transition-transform duration-300 hover:scale-105">
              <Image
                src={(items.image_url && /^(https?:)?\/\//.test(items.image_url) ? items.image_url : "/user.png")}
                alt="Startup Logo"
                className="w-full h-full object-cover"
                width={400}
                height={200}
              />
            </div>

            {/* Name + Founder */}
           <div className="w-full flex mt-5 justify-between items-center">
              <div className="flex flex-col">
                <div className="px-3 py-1 bg-pink-100 rounded-4xl group-hover:bg-amber-50 transition-all duration-300">
                  <Link
                    href={`/startup/${items.slug}`}
                    className="font-bold text-2xl"
                  >
                    {items.name}
                  </Link>
                </div>
                <Link
                  href={`/user/${items.founder_id}`}
                   onClick={(e) => e.stopPropagation()}
                  className="p-1 text-md hover:underline hover:text-blue-600"
                >
                  {items.profiles.full_name}
                </Link>
              </div>

              {/* Founder Image */}
              <Link
                href={`/user/${items.founder_id}`}
                className="w-15 h-15 overflow-hidden rounded-full"
                 onClick={(e) => e.stopPropagation()}
              >
                <Image
                 src={items.profiles.avatar_url || "/user.png"}
                  alt="Founder Image"
                  className="w-full h-full object-cover rounded-full"
                  width={60}
                  height={60}
                />
              </Link>
            </div>

            {/* Description */}
            <div className="w-full p-3 mt-3 border-l-4 border-pink-500 bg-pink-50 rounded transition-all duration-300 hover:shadow-lg hover:bg-gradient-to-r from-amber-100 to-amber-200 hover:border-amber-500 group-hover:bg-amber-50 group-hover:border-amber-400">
              <p className="text-gray-700 text-md line-clamp-3">
                {items.description}
              </p>
            </div>

            {/* Tag + Details */}
            <div className="mt-3 w-full flex justify-between items-center">
              <div className="bg-pink-100 text-pink-700 px-3 py-2 rounded-full text-sm font-medium shadow-sm group-hover:bg-amber-100 group-hover:text-amber-700">
                {items.tags[0]}
              </div>
              <p className="relative group text-sm text-pink-700 font-semibold group-hover:text-amber-600">
                Details
                <span className="block h-[2px] max-w-0 group-hover:max-w-full transition-all duration-300 bg-amber-700"></span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StartupCard;
