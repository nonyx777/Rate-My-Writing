import { vi } from "vitest";

const mockGenerateContent = vi.fn().mockResolvedValue({
  response: {
    text: vi.fn().mockResolvedValue("Mocked review text"),
  },
});

const mockGetGenerativeModel = vi.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

export default {
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
};
