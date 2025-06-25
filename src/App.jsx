import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

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
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are a writing assistant. Review the input for grammar, clarity, and style. Highlight issues and give constructive suggestions.",
            },
            {
              role: "user",
              content: text,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      setReview(response.data.choices[0].message.content);
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
    setText(`The quick brwn fox jump over the lazy dog. This sentence contain some grammatical errors and could be more engaging for the reader.

For example, we could add more descriptive language and fix any mistakes to make it more compelling to read.`);
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
          <p>{review}</p>
        </div>
      )}
    </div>
  );
}

export default App;
