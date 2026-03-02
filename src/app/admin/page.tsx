import { prisma } from "@/lib/prisma";
import TestimonialList from "@/components/admin/testimonial-list";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Testimonials
          </h1>
          <span className="text-sm text-gray-500">
            {testimonials.length} total
          </span>
        </div>
        <TestimonialList testimonials={testimonials} />
      </div>
    </main>
  );
}
