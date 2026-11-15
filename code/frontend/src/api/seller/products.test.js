import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../axios.js", () => ({
  default: { get: vi.fn() },
}));

import apiClient from "../axios.js";
import { getSellerProducts } from "./products.js";

const product = (id) => ({ id, slug: `p-${id}`, name: `Produit ${id}` });

describe("getSellerProducts", () => {
  beforeEach(() => {
    apiClient.get.mockReset();
  });

  it("charge toutes les pages de la pagination DRF", async () => {
    apiClient.get
      .mockResolvedValueOnce({
        data: { count: 3, next: "http://api/seller/products/?page=2", previous: null, results: [product(1), product(2)] },
      })
      .mockResolvedValueOnce({
        data: { count: 3, next: null, previous: "http://api/seller/products/?page=1", results: [product(3)] },
      });

    const data = await getSellerProducts();

    expect(apiClient.get).toHaveBeenCalledTimes(2);
    expect(apiClient.get).toHaveBeenNthCalledWith(1, "/seller/products/", { params: { page: 1 } });
    expect(apiClient.get).toHaveBeenNthCalledWith(2, "/seller/products/", { params: { page: 2 } });
    expect(data.count).toBe(3);
    expect(data.results.map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it("fait un seul appel quand il n'y a qu'une page", async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { count: 1, next: null, previous: null, results: [product(1)] },
    });

    const data = await getSellerProducts();

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(data.results).toHaveLength(1);
  });

  it("accepte une réponse non paginée (tableau)", async () => {
    apiClient.get.mockResolvedValueOnce({ data: [product(1), product(2)] });

    const data = await getSellerProducts();

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(data.results.map((p) => p.id)).toEqual([1, 2]);
  });
});
