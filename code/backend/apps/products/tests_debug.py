from rest_framework.test import APITestCase
from apps.core.factories import CategoryFactory, ProductFactory


class DebugInStockFilter(APITestCase):
    def test_filter(self):
        self.category = CategoryFactory(name="Tissus", slug="tissus")
        ProductFactory(category=self.category, name="Rupture", slug="rupture", price_xof=2000, stock=0)
        restauration = CategoryFactory(name="Restauration", slug="restauration")
        ProductFactory(category=restauration, name="Crepes", slug="crepes", price_xof=1500, stock=0, made_to_order=True)
        ProductFactory(category=self.category, name="Pagne", slug="pagne", price_xof=5000, stock=10)

        r = self.client.get("/api/products/", {"in_stock": "1"})
        print("URL:", r.request["PATH_INFO"], r.request["QUERY_STRING"])
        print("slugs:", [x["slug"] for x in r.data["results"]])
        print("raw:", r.data)
        self.assertEqual(sorted([x["slug"] for x in r.data["results"]]), ["crepes", "pagne"])
