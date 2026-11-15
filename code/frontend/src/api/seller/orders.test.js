import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../axios.js", () => ({
  default: { get: vi.fn() },
}));

import apiClient from "../axios.js";
import { getSellerOrders } from "./orders.js";

const order = (id, status = "pending") => ({ id, status });

describe("getSellerOrders", () => {
  beforeEach(() => {
    apiClient.get.mockReset();
  });

  it("charge toutes les pages de la pagination DRF", async () => {
    apiClient.get
      .mockResolvedValueOnce({
        data: {
          count: 21,
          next: "http://api/seller/orders/?page=2",
          previous: null,
          results: Array.from({ length: 20 }, (_, i) => order(i + 1)),
        },
      })
      .mockResolvedValueOnce({
        data: { count: 21, next: null, previous: "http://api/seller/orders/?page=1", results: [order(21, "paid")] },
      });

    const data = await getSellerOrders();

    expect(apiClient.get).toHaveBeenCalledTimes(2);
    expect(apiClient.get).toHaveBeenNthCalledWith(1, "/seller/orders/", { params: { page: 1 } });
    expect(apiClient.get).toHaveBeenNthCalledWith(2, "/seller/orders/", { params: { page: 2 } });
    expect(data.count).toBe(21);
    expect(data.results).toHaveLength(21);
    expect(data.results.at(-1)).toEqual(order(21, "paid"));
  });

  it("fait un seul appel quand il n'y a qu'une page", async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { count: 1, next: null, previous: null, results: [order(1)] },
    });

    const data = await getSellerOrders();

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(data.results).toHaveLength(1);
  });

  it("accepte une réponse non paginée (tableau)", async () => {
    apiClient.get.mockResolvedValueOnce({ data: [order(1), order(2)] });

    const data = await getSellerOrders();

    expect(data.results.map((o) => o.id)).toEqual([1, 2]);
  });
});
