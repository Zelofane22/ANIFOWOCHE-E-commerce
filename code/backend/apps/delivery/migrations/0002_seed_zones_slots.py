from django.db import migrations

ZONES = [
    {"name": "Akpakpa", "fee_xof": 500},
    {"name": "Cadjehoun", "fee_xof": 500},
    {"name": "Fidjrossè", "fee_xof": 500},
    {"name": "Ganhi", "fee_xof": 500},
    {"name": "Gbégamey", "fee_xof": 500},
    {"name": "Jonquet", "fee_xof": 500},
    {"name": "Sainte Rita", "fee_xof": 500},
    {"name": "Vodjè", "fee_xof": 500},
]

SLOTS = [
    {"label": "Matin", "start_time": "08:00", "end_time": "12:00"},
    {"label": "Soir", "start_time": "15:00", "end_time": "19:00"},
]


def seed(apps, schema_editor):
    DeliveryZone = apps.get_model("delivery", "DeliveryZone")
    DeliverySlot = apps.get_model("delivery", "DeliverySlot")
    for zone in ZONES:
        DeliveryZone.objects.get_or_create(name=zone["name"], defaults={"fee_xof": zone["fee_xof"]})
    for slot in SLOTS:
        DeliverySlot.objects.get_or_create(
            label=slot["label"],
            defaults={"start_time": slot["start_time"], "end_time": slot["end_time"]},
        )


def unseed(apps, schema_editor):
    DeliveryZone = apps.get_model("delivery", "DeliveryZone")
    DeliverySlot = apps.get_model("delivery", "DeliverySlot")
    DeliveryZone.objects.filter(name__in=[z["name"] for z in ZONES]).delete()
    DeliverySlot.objects.filter(label__in=[s["label"] for s in SLOTS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("delivery", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
