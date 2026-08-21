from django.db import migrations, models


def mark_main_store_official(apps, schema_editor):
    Shop = apps.get_model('sellers', 'Shop')
    main = Shop.objects.filter(slug='ets-anifowoche').first()
    if main is not None:
        Shop.objects.filter(is_official=True).update(is_official=False)
        main.is_official = True
        main.save(update_fields=['is_official'])


def reverse_official(apps, schema_editor):
    Shop = apps.get_model('sellers', 'Shop')
    Shop.objects.filter(is_official=True).update(is_official=False)


class Migration(migrations.Migration):

    dependencies = [
        ('sellers', '0008_migrate_paid_to_pro'),
    ]

    operations = [
        migrations.AddField(
            model_name='shop',
            name='is_official',
            field=models.BooleanField(
                default=False,
                help_text='Boutique officielle anifowoche.com : aucune limite de plan. Une seule boutique peut être officielle.',
            ),
        ),
        migrations.RunPython(mark_main_store_official, reverse_official),
    ]
