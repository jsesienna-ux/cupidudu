"use client";

import Link from "next/link";
import Image from "next/image";

type CardBoxItem = {
  id: string;
  status: string;
  created_at: string | null;
  viewed_at: string | null;
  is_read: boolean;
  manager_comment: string | null;
  profile: {
    id: string;
    full_name: string;
    job: string | null;
    image_url: string | null;
    age: number | null;
    mbti: string | null;
  } | null;
};

type CardBoxListProps = {
  items: (CardBoxItem & {
    arrivedDateFormatted: string;
    viewedDateFormatted: string;
  })[];
};

export function CardBoxList({ items }: CardBoxListProps) {
  return (
    <ul className="mt-6 space-y-4">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/cards/${encodeURIComponent(item.id)}`}
            className="block overflow-hidden rounded-2xl border-2 border-cupid-pinkSoft/50 bg-white shadow-sm transition hover:border-cupid-pink hover:shadow-md"
          >
            <div className="flex gap-4 p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cupid-pinkSoft/30">
                {item.profile?.image_url ? (
                  <Image
                    src={item.profile.image_url}
                    alt={`${item.profile.full_name} 프로필`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">
                    👤
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="truncate text-base font-semibold text-gray-800">
                    {item.profile?.full_name ?? "알 수 없음"}님
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.is_read
                        ? "bg-cupid-pinkSoft/70 text-cupid-pinkDark"
                        : "bg-cupid-pink/90 text-white"
                    }`}
                  >
                    {item.is_read ? "열람" : "미열람"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-cupid-gray">
                  도착: {item.arrivedDateFormatted}
                </p>
                <p className="text-xs text-cupid-gray">
                  확인: {item.viewedDateFormatted}
                </p>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
