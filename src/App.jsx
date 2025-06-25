import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4", // or gpt-3.5-turbo
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
    } catch (error) {
      console.error("Error fetching review:", error);
      setReview("Sorry, there was an issue with the review.");
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <h1>✍️ Rate My Writing</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your essay or paragraph here..."
        rows={12}
      />
      <button onClick={handleSubmit} disabled={loading || !text}>
        {loading ? "Analyzing..." : "Review My Writing"}
      </button>

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
