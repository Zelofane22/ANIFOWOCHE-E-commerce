from rest_framework.test import APITestCase
from apps.core.factories import CategoryFactory, ProductFactory
from apps.products.views import ProductViewSet


class DebugViewSet(APITestCase):
    def test_filter(self):
        self.category = CategoryFactory(name="Tissus", slug="tissus")
        ProductFactory(category=self.category, name="Rupture", slug="rupture", price_xof=2000, stock=0)
        restauration = CategoryFactory(name="Restauration", slug="restauration")
        ProductFactory(category=restauration, name="Crepes", slug="crepes", price_xof=1500, stock=0, made_to_order=True)
        ProductFactory(category=self.category, name="Pagne", slug="pagne", price_xof=5000, stock=10)

        from django_filters.rest_framework import DjangoFilterBackend
        view = ProductViewSet()
        view.action = 'list'
        view.setup(self.client.get('/api/products/', {'in_stock': '1'}).wsgi_request)
        backend = DjangoFilterBackend()
        fs = backend.get_filterset(view.request, ProductViewSet.queryset, view)
        print("filterset class:", type(fs).__name__ if fs else None)
        print("form data:", fs.form.data if fs else None)
        print("errors:", fs.form.errors if fs else None)
        print("qs:", list(fs.qs.values_list('slug', 'stock', 'made_to_order')) if fs else None)
