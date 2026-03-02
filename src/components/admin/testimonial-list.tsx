import Link from "next/link";
import type { TestimonialRecord } from "@/types";

interface Props {
  testimonials: TestimonialRecord[];
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    processing: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
}

export default function TestimonialList({ testimonials }: Props) {
  if (testimonials.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500">
        No testimonials yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              Course
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              Date
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {testimonials.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                {t.name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                {t.course}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                {statusBadge(t.status)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                {new Date(t.createdAt).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                <Link
                  href={`/admin/${t.id}`}
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
