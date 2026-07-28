"""
Shared pytest fixtures for the backend test suite.

Note: The project currently runs via `python manage.py test` (Django runner).
These fixtures activate when migrating to `pytest`. In the meantime, factories
can be imported directly in TestCase.setUp() methods.
"""
import pytest
from unittest import mock

import requests


@pytest.fixture
def mock_whatsapp():
    """Mock WhatsApp/Resend API calls — used across orders, payments, sellers, delivery."""
    with mock.patch(
        "apps.notifications.services.requests.post",
        side_effect=requests.exceptions.ConnectionError,
    ) as m:
        yield m


@pytest.fixture
def mock_fedapay_success():
    """Mock FedaPay API with successful transaction + token responses."""
    transaction_response = mock.Mock()
    transaction_response.json.return_value = {"v1/transaction": {"id": 42}}
    transaction_response.raise_for_status.return_value = None
    token_response = mock.Mock()
    token_response.json.return_value = {"url": "https://sandbox-pay.fedapay.com/t/42"}
    token_response.raise_for_status.return_value = None

    with mock.patch(
        "apps.payments.services.requests.post",
        side_effect=[transaction_response, token_response],
    ) as m:
        yield m


@pytest.fixture
def mock_fedapay_failure():
    """Mock FedaPay API with connection error."""
    with mock.patch(
        "apps.payments.services.requests.post",
        side_effect=requests.exceptions.ConnectionError,
    ) as m:
        yield m
