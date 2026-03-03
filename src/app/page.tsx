import SubmissionForm from "@/components/submission-form";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
          Share Your Experience
        </h1>
        <p className="mb-4 text-center text-gray-600">
          Record a quick 30–60 second video about your experience.
        </p>
        <div className="mb-8 text-gray-600">
          <p className="mb-2 font-medium">You might share:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>What you were struggling with before the course or event, or what you were hoping to learn</li>
            <li>Your experience</li>
            <li>What changed for you after? (Examples: it increased my knowledge or confidence talking about the Bible or reshaped my understanding)</li>
          </ul>
        </div>
      </div>
      <SubmissionForm />
    </main>
  );
}
