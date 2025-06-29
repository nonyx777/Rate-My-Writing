import React, { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import "./App.css";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const safetySettings = [
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_NONE",
  },
];

console.log(
  "Gemini Key:",
  import.meta.env.VITE_GEMINI_API_KEY ? "Loaded" : "Missing",
);

async function getGeminiReview(text) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });
  const prompt = `You are a writing assistant. Review the input for grammar, clarity, and style. Identify issues, give constructive suggestions and rate it from 5:
    ${text}
    `;
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      safetySettings,
    });
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error: ", error);
    throw error;
  }
}

function App() {
  const [text, setText] = useState("");
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSubmitted, setLastSubmitted] = useState(null);

  // Load saved text from localStorage on component mount
  useEffect(() => {
    const savedText = localStorage.getItem("writingText");
    if (savedText) setText(savedText);
  }, []);

  // Save text to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("writingText", text);
  }, [text]);

  const handleSubmit = async () => {
    // Rate limiting check
    if (lastSubmitted && Date.now() - lastSubmitted < 5000) {
      setError("Please wait a few seconds before submitting again");
      return;
    }

    if (!text.trim()) {
      setError("Please enter some text to review");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const review = await getGeminiReview(text);
      setReview(review);
      setLastSubmitted(Date.now());
    } catch (error) {
      console.error("Error fetching review:", error);
      setError("Sorry, there was an issue with the review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setReview(null);
    setError(null);
  };

  const loadExample = () => {
    setText(`The quick brwn fox jump over the lazy dog.`);
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="app-container">
      <h1>✍️ Rate My Writing</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your essay or paragraph here..."
        rows={12}
      />

      <div className="counters">
        <span>{wordCount} words</span>
        <span>{charCount} characters</span>
      </div>

      <div className="button-group">
        <button onClick={handleSubmit} disabled={loading || !text.trim()}>
          {loading ? "Analyzing..." : "Review My Writing"}
        </button>

        <button
          onClick={handleClear}
          disabled={!text && !review}
          className="secondary"
        >
          Clear
        </button>

        <button onClick={loadExample} className="secondary">
          Load Example
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {review && (
        <div className="review-box">
          <h2>📋 Feedback</h2>
          <ReactMarkdown>{review}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default App;
