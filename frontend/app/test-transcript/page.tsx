"use client";

import { useState } from "react";
import { sendTranscriptClient } from "@/lib/transcripts/client";

export default function TestTranscriptPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an audio file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Sending file to transcript API:", file.name);
      const response = await sendTranscriptClient({ file });
      console.log("Transcript API response:", response);
      setResult(response);
    } catch (err) {
      console.error("Transcript API error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Test Transcript API</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Audio File</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="audio-file" className="block text-sm font-medium text-gray-700 mb-2">
              Select Audio File (mp3, wav, m4a, etc.)
            </label>
            <input
              id="audio-file"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <div className="text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded"
          >
            {loading ? "Processing..." : "Transcribe & Analyze"}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-800">Results</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700">Status:</h3>
              <p className="text-green-600">✅ {result.ok ? "Success" : "Failed"}</p>
            </div>

            {result.conversation_id && (
              <div>
                <h3 className="font-semibold text-gray-700">Conversation ID:</h3>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">{result.conversation_id}</p>
              </div>
            )}

            {result.conversation && (
              <div>
                <h3 className="font-semibold text-gray-700">Conversation:</h3>
                <div className="bg-gray-100 p-4 rounded space-y-2">
                  {result.conversation.map((turn: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <strong className="text-blue-700">{turn.speaker}:</strong>
                      <p className="text-gray-800">{turn.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.analysis && (
              <div>
                <h3 className="font-semibold text-gray-700">Analysis:</h3>
                <div className="bg-gray-100 p-4 rounded">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {JSON.stringify(result.analysis, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-gray-700">Raw Response (Debug)</summary>
              <div className="bg-gray-100 p-4 rounded mt-2">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Make sure your backend server is running on <code>http://localhost:5000</code></li>
          <li>Upload an audio file (mp3, wav, m4a, etc.)</li>
          <li>Click &quot;Transcribe & Analyze&quot; to test the integration</li>
          <li>Check the browser console for detailed logs</li>
          <li>Verify the conversation is saved to your Supabase database</li>
        </ol>
      </div>
    </div>
  );
}
