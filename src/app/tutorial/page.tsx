export default function TutorialPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          How to Submit Your Testimonial
        </h1>

        <div className="space-y-8">
          <section className="rounded-xl bg-white p-6 shadow">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                1
              </span>
              <h2 className="text-xl font-semibold text-gray-900">
                Enter Your Details
              </h2>
            </div>
            <p className="ml-11 text-gray-600">
              Fill in your <strong>full name</strong> and the{" "}
              <strong>course name</strong> you completed. This helps us identify
              your testimonial and associate it with the right program.
            </p>
          </section>

          <section className="rounded-xl bg-white p-6 shadow">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                2
              </span>
              <h2 className="text-xl font-semibold text-gray-900">
                Take a Headshot Photo
              </h2>
            </div>
            <div className="ml-11 space-y-2 text-gray-600">
              <p>
                Click <strong>Open Camera</strong> to activate your webcam. When
                you&apos;re ready, click <strong>Take Photo</strong> to capture
                your headshot.
              </p>
              <p className="text-sm text-gray-500">
                Tips: Find good lighting, face the camera directly, and use a
                clean background. You can always click <strong>Retake</strong> if
                you&apos;re not happy with the result.
              </p>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                3
              </span>
              <h2 className="text-xl font-semibold text-gray-900">
                Record Your Video Testimonial
              </h2>
            </div>
            <div className="ml-11 space-y-2 text-gray-600">
              <p>
                Click <strong>Open Camera</strong> to start your webcam with
                audio, then click <strong>Start Recording</strong> when
                you&apos;re ready to speak.
              </p>
              <p>
                You have up to <strong>2 minutes</strong> to share your
                experience. A timer will show your progress, and the recording
                will automatically stop at the 2-minute mark.
              </p>
              <p>
                Click <strong>Stop Recording</strong> when you&apos;re done. You
                can preview your video and click <strong>Re-record</strong> if
                you&apos;d like to try again.
              </p>
              <p className="text-sm text-gray-500">
                Tips: Speak naturally about what you learned, how the course
                helped you, and whether you&apos;d recommend it to others.
              </p>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                4
              </span>
              <h2 className="text-xl font-semibold text-gray-900">
                Submit
              </h2>
            </div>
            <div className="ml-11 space-y-2 text-gray-600">
              <p>
                Once all fields are filled and both your photo and video are
                captured, click <strong>Submit Testimonial</strong>.
              </p>
              <p>
                The upload and processing may take a minute or two. Please
                don&apos;t close the page until you see the confirmation
                message.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="mb-2 text-lg font-semibold text-blue-900">
              What Happens Next?
            </h2>
            <ul className="ml-4 list-disc space-y-1 text-blue-800">
              <li>
                Your headshot and video are securely uploaded to our cloud
                storage.
              </li>
              <li>
                A transcript of your video is automatically generated.
              </li>
              <li>
                Our team will review your testimonial and may feature it on our
                website or marketing materials.
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to Submission Form
          </a>
        </div>
      </div>
    </main>
  );
}
