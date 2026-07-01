from unittest import mock

import requests
from django.test import TestCase

from apps.delivery.models import Delivery, DeliverySlot, DeliveryZone
from apps.orders.models import Order

from .models import Notification
from .services import notify_delivery_in_transit, notify_order_confirmation


class NotificationServiceTests(TestCase):
    def setUp(self):
        self.order = Order.objects.create(full_name="Client", phone="+22990000000", address="Cotonou", total_xof=1000)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_notify_order_confirmation_stores_failed_status_on_provider_error(self, mock_post):
        notification = notify_order_confirmation(self.order)
        self.assertEqual(notification.status, Notification.Status.FAILED)
        self.assertEqual(notification.event, Notification.Event.ORDER_CONFIRMATION)
        self.assertIn("Client", notification.message)

    def test_notify_order_confirmation_stores_sent_status_on_success(self):
        response = mock.Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {"messages": [{"id": "wamid.abc"}]}

        with mock.patch("apps.notifications.services.requests.post", return_value=response):
            notification = notify_order_confirmation(self.order)

        self.assertEqual(notification.status, Notification.Status.SENT)
        self.assertEqual(notification.provider_message_id, "wamid.abc")

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_notify_delivery_in_transit(self, mock_post):
        zone = DeliveryZone.objects.create(name="Zone Test", fee_xof=500)
        slot = DeliverySlot.objects.create(label="Créneau Test", start_time="08:00", end_time="12:00")
        delivery = Delivery.objects.create(order=self.order, zone=zone, slot=slot, status="in_transit")

        notification = notify_delivery_in_transit(delivery)

        self.assertEqual(notification.event, Notification.Event.DELIVERY_IN_TRANSIT)
        self.assertIn("Zone Test", notification.message)
