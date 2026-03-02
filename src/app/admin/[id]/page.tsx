import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TestimonialDetail from "@/components/admin/testimonial-detail";

export const dynamic = "force-dynamic";

export default async function AdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const testimonial = await prisma.testimonial.findUnique({
    where: { id },
  });

  if (!testimonial) notFound();

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <TestimonialDetail testimonial={testimonial} />
      </div>
    </main>
  );
}
