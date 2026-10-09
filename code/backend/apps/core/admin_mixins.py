class ReadOnlyAdminMixin:
    """Consultation seule : interdire l'ajout, la modification et la suppression.

    Utilisé par les sections du backoffice dont les données appartiennent à la
    boutique ou aux vendeurs (catalogue, commandes, paiements…), gérées dans
    leur espace seller. La consultation (changelist + fiche) reste permise.
    """

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
