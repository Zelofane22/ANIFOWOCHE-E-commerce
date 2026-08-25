from django.db import migrations


def assign_business_to_official_sellers(apps, schema_editor):
    SellerProfile = apps.get_model("sellers", "SellerProfile")
    Shop = apps.get_model("sellers", "Shop")
    official_seller_ids = Shop.objects.filter(is_official=True).values_list("seller_id", flat=True)
    SellerProfile.objects.filter(pk__in=official_seller_ids).exclude(plan="BUSINESS").update(plan="BUSINESS")


def reverse_assign_business(apps, schema_editor):
    # No safe reverse: the previous plan is not stored by this migration.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("sellers", "0010_sellersubscription_last_expiry_reminder_at"),
    ]

    operations = [
        migrations.RunPython(assign_business_to_official_sellers, reverse_assign_business),
    ]
