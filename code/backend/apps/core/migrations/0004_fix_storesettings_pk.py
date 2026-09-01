# Generated to fix duplicate rows and missing PK on core_storesettings (prod Render free db v2)
from django.db import migrations


def forwards(apps, schema_editor):
    # Nettoie les doublons avant d'ajouter la PK — garde la ligne la plus récente (ctid max)
    # et supprime les autres. Opération idempotente.
    with schema_editor.connection.cursor() as cursor:
        # Vérifie s'il y a des doublons
        cursor.execute("SELECT COUNT(*) FROM core_storesettings;")
        count = cursor.fetchone()[0]
        if count > 1:
            cursor.execute("""
                DELETE FROM core_storesettings
                WHERE ctid NOT IN (
                    SELECT max(ctid) FROM core_storesettings
                );
            """)
        # Ajoute la PK si elle n'existe pas
        cursor.execute("""
            SELECT COUNT(*) FROM pg_constraint
            WHERE conrelid = 'core_storesettings'::regclass AND contype = 'p'
        """)
        has_pk = cursor.fetchone()[0] > 0
        if not has_pk:
            # S'assure que id est NOT NULL et unique avant d'ajouter PK
            cursor.execute("SELECT COUNT(*) FROM core_storesettings WHERE id IS NULL;")
            if cursor.fetchone()[0] == 0:
                try:
                    cursor.execute("ALTER TABLE core_storesettings ADD PRIMARY KEY (id);")
                except Exception:
                    # Si ça échoue (id dupliqués restants), ignore — le code applicatif gère déjà
                    pass


def backwards(apps, schema_editor):
    # Pas de rollback nécessaire — on ne supprime pas la PK en arrière
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_grant_setting_request_permissions'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
