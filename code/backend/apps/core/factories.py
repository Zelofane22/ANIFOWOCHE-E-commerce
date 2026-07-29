import factory
from django.contrib.auth.models import User

from apps.appearance.models import HomeSection, SiteTheme
from apps.content.models import Banner
from apps.core.models import SettingChangeRequest, StoreSettings
from apps.delivery.models import Delivery, DeliverySlot, DeliveryZone
from apps.notifications.models import (
    BackofficeNotification,
    Notification,
    NotificationSettings,
)
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment, PaymentSettings
from apps.products.models import Category, Option, OptionGroup, Product, ProductImage
from apps.promotions.models import Coupon, Promotion
from apps.returns.models import ReturnRequest
from apps.reviews.models import Review
from apps.sellers.models import SellerProfile, Shop
from apps.users.models import Profile
from apps.wishlist.models import WishlistItem


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    password = factory.PostGenerationMethodCall("set_password", "pass1234")


class SuperUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"superuser{n}")
    is_staff = True
    is_superuser = True
    password = factory.PostGenerationMethodCall("set_password", "pass1234")


class StaffUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"staff{n}")
    is_staff = True
    password = factory.PostGenerationMethodCall("set_password", "pass1234")


class ProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Profile

    user = factory.SubFactory(UserFactory)
    phone = ""
    notification_channel = Profile.NotificationChannel.EMAIL


class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Category

    name = factory.Sequence(lambda n: f"Category {n}")
    slug = factory.Sequence(lambda n: f"category-{n}")


class SellerProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SellerProfile

    user = factory.SubFactory(UserFactory)
    display_name = factory.Sequence(lambda n: f"Seller {n}")
    phone = factory.Sequence(lambda n: f"+2299000000{n:02d}")


class ShopFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Shop

    seller = factory.SubFactory(SellerProfileFactory)
    name = factory.Sequence(lambda n: f"Shop {n}")
    whatsapp_phone = factory.Sequence(lambda n: f"+2299000000{n:02d}")


class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Product

    category = factory.SubFactory(CategoryFactory)
    seller = None
    shop = None
    name = factory.Sequence(lambda n: f"Product {n}")
    price_xof = 5000
    stock = 10
    is_active = True

    class Params:
        inactive = factory.Trait(is_active=False, stock=0)


class OptionGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OptionGroup

    product = factory.SubFactory(ProductFactory)
    name = factory.Sequence(lambda n: f"Group {n}")


class OptionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Option

    group = factory.SubFactory(OptionGroupFactory)
    name = factory.Sequence(lambda n: f"Option {n}")
    price_xof = 0


class ProductImageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProductImage

    product = factory.SubFactory(ProductFactory)
    image = "products/gallery/test.jpg"


class OrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Order

    customer = None
    full_name = "Client"
    phone = "+22990000000"
    address = "Cotonou"
    total_xof = 0
    status = Order.Status.RECEIVED

    class Params:
        delivered = factory.Trait(status=Order.Status.DELIVERED)
        cancelled = factory.Trait(status=Order.Status.CANCELLED)
        prepared = factory.Trait(status=Order.Status.PREPARED)


class OrderItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OrderItem

    order = factory.SubFactory(OrderFactory)
    product = factory.SubFactory(ProductFactory)
    quantity = 1
    unit_price_xof = factory.LazyAttribute(lambda o: o.product.price_xof)


class PaymentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Payment

    order = factory.SubFactory(OrderFactory)
    method = "mtn"
    amount_xof = 1000

    class Params:
        approved = factory.Trait(status=Payment.Status.APPROVED)
        declined = factory.Trait(status=Payment.Status.DECLINED)
        failed = factory.Trait(status=Payment.Status.FAILED)
        pending = factory.Trait(status=Payment.Status.PENDING)
        canceled = factory.Trait(
            provider=Payment.Provider.CASH_ON_DELIVERY,
            method=Payment.Method.CASH_ON_DELIVERY,
            status=Payment.Status.CANCELED,
        )


class DeliveryZoneFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = DeliveryZone

    name = factory.Sequence(lambda n: f"Zone {n}")
    fee_xof = 500


class DeliverySlotFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = DeliverySlot

    label = factory.Sequence(lambda n: f"Slot {n}")
    start_time = "08:00"
    end_time = "12:00"


class DeliveryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Delivery

    order = factory.SubFactory(OrderFactory)
    zone = factory.SubFactory(DeliveryZoneFactory)
    slot = factory.SubFactory(DeliverySlotFactory)


class CouponFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Coupon

    code = factory.Sequence(lambda n: f"CODE{n}")
    discount_percent = 10
    max_uses = 5
    used_count = 0
    is_active = True


class PromotionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Promotion

    name = factory.Sequence(lambda n: f"Promo {n}")
    discount_percent = 20
    is_active = True
    starts_at = factory.LazyFunction(lambda: __import__("django.utils.timezone", fromlist=["now"]).now())
    ends_at = factory.LazyFunction(
        lambda: __import__("django.utils.timezone", fromlist=["now"]).now() + __import__("datetime", fromlist=["timedelta"]).timedelta(days=30)
    )


class ReturnRequestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ReturnRequest

    order = factory.SubFactory(OrderFactory)
    reason = "Motif test"
    status = ReturnRequest.Status.REQUESTED


class ReviewFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Review

    product = factory.SubFactory(ProductFactory)
    author_name = factory.Sequence(lambda n: f"Reviewer {n}")
    rating = 5
    comment = "Super produit"
    is_approved = False


class WishlistItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = WishlistItem

    user = factory.SubFactory(UserFactory)
    product = factory.SubFactory(ProductFactory)


class BannerFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Banner

    title = factory.Sequence(lambda n: f"Banner {n}")
    is_published = True
    order = 0


class NotificationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Notification

    channel = Notification.Channel.EMAIL
    event = Notification.Event.ORDER_CONFIRMATION
    message = "Notification test"
    status = Notification.Status.PENDING


class BackofficeNotificationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BackofficeNotification

    kind = BackofficeNotification.Kind.SYSTEM_ERROR
    severity = BackofficeNotification.Severity.WARNING
    title = "Alerte test"
    message = "Message d'alerte"


class SettingChangeRequestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SettingChangeRequest

    setting_key = SettingChangeRequest.SettingKey.PAYMENT_METHOD_MTN
    target_value = False
    reason = "Test"
    requested_by = factory.SubFactory(UserFactory)
    status = SettingChangeRequest.Status.PENDING
