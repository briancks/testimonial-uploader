import SubmissionForm from "@/components/submission-form";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Share Your Experience
        </h1>
        <p className="mb-8 text-gray-600">
          Record a short video testimonial about your course experience.
          It only takes a couple of minutes!
        </p>
      </div>
      <SubmissionForm />
    </main>
  );
}
