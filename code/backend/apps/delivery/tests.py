from unittest import mock

import requests
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase

from apps.core.factories import (
    CategoryFactory,
    DeliveryFactory,
    DeliverySlotFactory,
    DeliveryZoneFactory,
    OrderFactory,
    ProductFactory,
    UserFactory,
)
from apps.notifications.models import Notification

User = get_user_model()


class DeliveryApiTests(APITestCase):
    def setUp(self):
        self.zone = DeliveryZoneFactory(name="Zone Test", fee_xof=500)
        self.slot = DeliverySlotFactory(label="Créneau Test", start_time="08:00", end_time="12:00")
        self.order = OrderFactory(
            full_name="Client", phone="+2290190000000", email="client@example.com", address="Akpakpa", total_xof=1000
        )
        self.staff_user = UserFactory(username="admin", is_staff=True)

    def test_zones_and_slots_are_publicly_readable(self):
        self.assertEqual(self.client.get("/api/delivery/zones/").status_code, 200)
        self.assertEqual(self.client.get("/api/delivery/slots/").status_code, 200)

    def test_anyone_can_create_a_delivery_for_guest_checkout(self):
        response = self.client.post(
            "/api/delivery/", {"order_id": self.order.id, "zone_id": self.zone.id, "slot_id": self.slot.id},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_cannot_create_two_deliveries_for_same_order(self):
        DeliveryFactory(order=self.order, zone=self.zone, slot=self.slot)
        response = self.client.post(
            "/api/delivery/", {"order_id": self.order.id, "zone_id": self.zone.id, "slot_id": self.slot.id},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_anonymous_cannot_list_deliveries(self):
        response = self.client.get("/api/delivery/")
        self.assertEqual(response.status_code, 401)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_transition_to_in_transit_creates_notification(self, mock_post):
        delivery = DeliveryFactory(order=self.order, zone=self.zone, slot=self.slot)
        self.client.force_authenticate(user=self.staff_user)

        response = self.client.patch(f"/api/delivery/{delivery.id}/", {"status": "in_transit"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            Notification.objects.filter(event=Notification.Event.DELIVERY_IN_TRANSIT, recipient_email=self.order.email).exists()
        )

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_transition_to_same_status_does_not_duplicate_notification(self, mock_post):
        delivery = DeliveryFactory(order=self.order, zone=self.zone, slot=self.slot, status="in_transit")
        self.client.force_authenticate(user=self.staff_user)

        self.client.patch(f"/api/delivery/{delivery.id}/", {"courier_name": "Kokou"}, format="json")

        self.assertEqual(
            Notification.objects.filter(event=Notification.Event.DELIVERY_IN_TRANSIT).count(), 0
        )


class DeliveryAdminTests(TestCase):
    def setUp(self):
        from apps.core.factories import SuperUserFactory
        self.admin = SuperUserFactory(username="delivery-admin")
        self.client.force_login(self.admin)

    def test_deliveryzone_changelist(self):
        response = self.client.get("/admin/delivery/deliveryzone/")
        self.assertEqual(response.status_code, 200)

    def test_deliveryzone_add_form(self):
        response = self.client.get("/admin/delivery/deliveryzone/add/")
        self.assertEqual(response.status_code, 200)

    def test_deliveryslot_changelist(self):
        response = self.client.get("/admin/delivery/deliveryslot/")
        self.assertEqual(response.status_code, 200)

    def test_deliveryslot_add_form(self):
        response = self.client.get("/admin/delivery/deliveryslot/add/")
        self.assertEqual(response.status_code, 200)

    def test_delivery_changelist(self):
        response = self.client.get("/admin/delivery/delivery/")
        self.assertEqual(response.status_code, 200)

    def test_delivery_add_form(self):
        response = self.client.get("/admin/delivery/delivery/add/")
        self.assertEqual(response.status_code, 200)

    def test_non_staff_cannot_access(self):
        from apps.core.factories import UserFactory
        user = UserFactory(username="regular-delivery")
        self.client.force_login(user)
        response = self.client.get("/admin/delivery/deliveryzone/")
        self.assertEqual(response.status_code, 302)
