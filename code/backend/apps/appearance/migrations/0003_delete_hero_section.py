from django.db import migrations


def delete_hero_sections(apps, schema_editor):
    # Supprime les sections « Héro / carrousel » encore présentes en base
    # (type retiré des choix des sections d'accueil).
    HomeSection = apps.get_model("appearance", "HomeSection")
    HomeSection.objects.filter(section_type="hero").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("appearance", "0002_alter_homesection_section_type"),
    ]

    operations = [
        migrations.RunPython(delete_hero_sections, migrations.RunPython.noop),
    ]
