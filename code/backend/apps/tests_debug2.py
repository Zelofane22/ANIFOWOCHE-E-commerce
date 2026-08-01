from rest_framework.test import APITestCase
from apps.core.factories import CategoryFactory, ProductFactory
from apps.products.filters import ProductFilter
from apps.products.models import Product
from apps.products.views import ProductViewSet


class DebugViewSet(APITestCase):
    def test_filter(self):
        self.category = CategoryFactory(name="Tissus", slug="tissus")
        ProductFactory(category=self.category, name="Rupture", slug="rupture", price_xof=2000, stock=0)
        restauration = CategoryFactory(name="Restauration", slug="restauration")
        ProductFactory(category=restauration, name="Crepes", slug="crepes", price_xof=1500, stock=0, made_to_order=True)
        ProductFactory(category=self.category, name="Pagne", slug="pagne", price_xof=5000, stock=10)

        print("query_params on request:", self.client.get("/api/products/", {"in_stock": "1"}).wsgi_request.GET)
        fs = ProductFilter({"in_stock": "1"}, queryset=ProductViewSet.queryset)
        print("valid:", fs.is_valid(), "errors:", fs.form.errors)
        print("direct qs:", list(fs.qs.values_list("slug", "stock", "made_to_order")))
