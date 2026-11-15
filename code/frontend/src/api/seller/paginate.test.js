import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../axios.js", () => ({
  default: { get: vi.fn() },
}));

import apiClient from "../axios.js";
import { fetchAllPages, MAX_PAGES } from "./paginate.js";

describe("fetchAllPages", () => {
  beforeEach(() => {
    apiClient.get.mockReset();
  });

  it(`s'arrête après ${MAX_PAGES} pages même si next reste renseigné`, async () => {
    apiClient.get.mockResolvedValue({ data: { count: 9999, next: "http://api/x/?page=n", results: [{ id: 1 }] } });

    const data = await fetchAllPages("/x/");

    expect(apiClient.get).toHaveBeenCalledTimes(MAX_PAGES);
    expect(data.results).toHaveLength(MAX_PAGES);
  });

  it("gère une page sans results", async () => {
    apiClient.get.mockResolvedValueOnce({ data: { count: 0, next: null } });

    const data = await fetchAllPages("/x/");

    expect(data).toEqual({ count: 0, results: [] });
  });
});
