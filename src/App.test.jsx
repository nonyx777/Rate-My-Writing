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
});
