function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-purple-600 mb-6">
        HIRE or FIRE
      </h1>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold mb-4">
          AI Resume Screening System
        </h2>

        <p className="text-gray-600 mb-4">
          Upload resumes and compare them against job descriptions using AI.
        </p>

        <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
          Upload Resume
        </button>
      </div>
    </div>
  );
}

export default App;