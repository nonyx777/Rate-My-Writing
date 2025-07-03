import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import App from "./App";

// Mock the GoogleGenerativeAI module
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: vi.fn().mockResolvedValue("Mocked review text") },
      }),
    })),
  })),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key]),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

vi.stubGlobal("localStorage", localStorageMock);

describe("App Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test("renders main title", () => {
    render(<App />);
    expect(screen.getByText("✍️ Rate My Writing")).toBeInTheDocument();
  });

  test("renders textarea", () => {
    render(<App />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  test("loads example text when button clicked", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Load Example"));
    expect(screen.getByRole("textbox").value).toContain("quick brwn fox");
  });

  test("shows loading state during submission", async () => {
    render(<App />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Valid text" },
    });
    fireEvent.click(screen.getByText("Review My Writing"));

    expect(screen.getByText("Analyzing...")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Analyzing...")).not.toBeInTheDocument();
    });
  });

  test("submit button is disabled when text is empty", () => {
    render(<App />);
    expect(screen.getByText("Review My Writing")).toBeDisabled();
  });

  // New test case: Updates text area value on change
  test("updates textarea value on change", () => {
    render(<App />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Hello world" } });
    expect(textarea.value).toBe("Hello world");
  });

  // New test case: Displays correct word and character counts
  test("displays correct word and character counts", () => {
    render(<App />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Hello world" } });
    expect(screen.getByText("2 words")).toBeInTheDocument();
    expect(screen.getByText("11 characters")).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "One two three" } });
    expect(screen.getByText("3 words")).toBeInTheDocument();
    expect(screen.getByText("13 characters")).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "" } });
    expect(screen.getByText("0 words")).toBeInTheDocument();
    expect(screen.getByText("0 characters")).toBeInTheDocument();
  });

  // New test case: Clears text and review when "Clear" button is clicked
  test("clears text and review when clear button clicked", async () => {
    render(<App />);
    const textarea = screen.getByRole("textbox");

    // Enter some text and get a review
    fireEvent.change(textarea, { target: { value: "Some text to clear" } });
    fireEvent.click(screen.getByText("Review My Writing"));
    await waitFor(() =>
      expect(screen.getByText("Mocked review text")).toBeInTheDocument(),
    );

    // Click the clear button
    fireEvent.click(screen.getByText("Clear"));

    // Expect textarea to be empty and review to be gone
    expect(textarea.value).toBe("");
    expect(screen.queryByText("Mocked review text")).not.toBeInTheDocument();
    expect(screen.queryByText("📋 Feedback")).not.toBeInTheDocument();
  });

  // New test case: Displays review after successful submission
  test("displays review after successful submission", async () => {
    render(<App />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "This is some text." } });
    fireEvent.click(screen.getByText("Review My Writing"));

    // Wait for the review to appear
    await waitFor(() => {
      expect(screen.getByText("Mocked review text")).toBeInTheDocument();
    });
    expect(screen.getByText("📋 Feedback")).toBeInTheDocument();
  });

  // New test case: Saves text to localStorage on change
  test("saves text to localStorage on change", () => {
    render(<App />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Text to be saved" } });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "writingText",
      "Text to be saved",
    );
  });

  // New test case: Loads text from localStorage on mount
  test("loads text from localStorage on mount", () => {
    localStorageMock.setItem("writingText", "Loaded text from storage");
    render(<App />);
    expect(screen.getByRole("textbox").value).toBe("Loaded text from storage");
    expect(localStorageMock.getItem).toHaveBeenCalledWith("writingText");
  });
});
