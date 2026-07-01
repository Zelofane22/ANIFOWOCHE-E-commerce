from rest_framework import permissions
from rest_framework.generics import CreateAPIView

from .models import PageView
from .serializers import PageViewSerializer


class PageViewCreateView(CreateAPIView):
    queryset = PageView.objects.all()
    serializer_class = PageViewSerializer
    permission_classes = [permissions.AllowAny]
