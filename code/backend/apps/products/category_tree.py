"""Arborescence par défaut des catégories de produits (3 niveaux).

Ce module définit la structure de l'arbre et un helper de création idempotent.
Il est importé par la migration de données et par la commande `seed_categories`.
"""

CATEGORY_TREE = [
    {
        "name": "Femmes",
        "slug": "women",
        "children": [
            {
                "name": "Vêtements",
                "slug": "clothing",
                "children": [
                    {"name": "Robes", "slug": "women-dresses"},
                    {"name": "Hauts", "slug": "women-tops"},
                    {"name": "Pantalons", "slug": "women-pants"},
                    {"name": "Jupes", "slug": "skirts"},
                    {"name": "Ensembles/Tailleurs", "slug": "suits-sets"},
                    {"name": "Tenues traditionnelles", "slug": "women-traditional-wear"},
                ],
            },
            {
                "name": "Chaussures",
                "slug": "shoes",
                "children": [
                    {"name": "Sandales", "slug": "women-sandals"},
                    {"name": "Talons", "slug": "heels"},
                    {"name": "Baskets", "slug": "women-sneakers"},
                    {"name": "Bottes", "slug": "women-boots"},
                ],
            },
            {
                "name": "Accessoires",
                "slug": "accessories",
                "children": [
                    {"name": "Sacs", "slug": "bags"},
                    {"name": "Bijoux", "slug": "jewelry"},
                    {"name": "Foulards & Écharpes", "slug": "scarves"},
                    {"name": "Ceintures", "slug": "women-belts"},
                ],
            },
            {
                "name": "Beauté",
                "slug": "beauty",
                "children": [
                    {"name": "Maquillage", "slug": "makeup"},
                    {"name": "Soins peau", "slug": "skincare"},
                    {"name": "Parfums", "slug": "perfumes"},
                ],
            },
        ],
    },
    {
        "name": "Hommes",
        "slug": "men",
        "children": [
            {
                "name": "Vêtements",
                "slug": "clothing",
                "children": [
                    {"name": "Chemises", "slug": "shirts"},
                    {"name": "Pantalons", "slug": "men-pants"},
                    {"name": "Boubous & Ensembles traditionnels", "slug": "men-traditional-wear"},
                    {"name": "Costumes", "slug": "suits"},
                    {"name": "T-shirts", "slug": "t-shirts"},
                    {"name": "Vêtements de sport", "slug": "sportswear"},
                ],
            },
            {
                "name": "Chaussures",
                "slug": "shoes",
                "children": [
                    {"name": "Sneakers", "slug": "men-sneakers"},
                    {"name": "Chaussures de ville", "slug": "dress-shoes"},
                    {"name": "Sandales", "slug": "men-sandals"},
                ],
            },
            {
                "name": "Accessoires",
                "slug": "accessories",
                "children": [
                    {"name": "Montres", "slug": "watches"},
                    {"name": "Ceintures", "slug": "men-belts"},
                    {"name": "Chapeaux/Bonnets", "slug": "hats"},
                    {"name": "Sacs & Portefeuilles", "slug": "bags-wallets"},
                ],
            },
        ],
    },
    {
        "name": "Enfants",
        "slug": "kids",
        "children": [
            {
                "name": "Vêtements bébé 0-2 ans",
                "slug": "baby-clothing",
                "children": [
                    {"name": "Body", "slug": "bodysuits"},
                    {"name": "Pyjamas", "slug": "pajamas"},
                    {"name": "Ensembles", "slug": "baby-sets"},
                ],
            },
            {
                "name": "Fille 3-14 ans",
                "slug": "girls",
                "children": [
                    {"name": "Robes", "slug": "girls-dresses"},
                    {"name": "Hauts", "slug": "girls-tops"},
                    {"name": "Bas", "slug": "girls-bottoms"},
                ],
            },
            {
                "name": "Garçon 3-14 ans",
                "slug": "boys",
                "children": [
                    {"name": "Hauts", "slug": "boys-tops"},
                    {"name": "Bas", "slug": "boys-bottoms"},
                    {"name": "Ensembles", "slug": "boys-sets"},
                ],
            },
            {
                "name": "Chaussures enfant",
                "slug": "kids-shoes",
                "children": [
                    {"name": "Sandales", "slug": "kids-sandals"},
                    {"name": "Baskets", "slug": "kids-sneakers"},
                    {"name": "Bottes", "slug": "kids-boots"},
                ],
            },
            {
                "name": "Jouets & Puériculture",
                "slug": "toys-childcare",
                "children": [
                    {"name": "Jouets", "slug": "kids-toys"},
                    {"name": "Poussettes/sièges", "slug": "strollers-car-seats"},
                    {"name": "Biberons & Repas", "slug": "feeding"},
                ],
            },
        ],
    },
    {
        "name": "Tissus & Textiles",
        "slug": "fabrics",
        "children": [
            {
                "name": "Wax / Pagne",
                "slug": "wax",
                "children": [
                    {"name": "Wax hollandais", "slug": "dutch-wax"},
                    {"name": "Wax local", "slug": "local-wax"},
                    {"name": "Coupons", "slug": "fabric-cuts"},
                ],
            },
            {
                "name": "Bazin",
                "slug": "bazin",
                "children": [
                    {"name": "Bazin riche", "slug": "bazin-riche"},
                    {"name": "Bazin getzner", "slug": "bazin-getzner"},
                ],
            },
            {
                "name": "Kente",
                "slug": "kente",
                "children": [
                    {"name": "Kente", "slug": "kente"},
                ],
            },
            {
                "name": "Dentelle",
                "slug": "lace",
                "children": [
                    {"name": "Dentelle", "slug": "lace"},
                ],
            },
            {
                "name": "Tissus unis & autres",
                "slug": "plain-other",
                "children": [
                    {"name": "Tissus unis", "slug": "plain-fabrics"},
                    {"name": "Autres", "slug": "other-fabrics"},
                ],
            },
        ],
    },
    {
        "name": "Maison",
        "slug": "home",
        "children": [
            {
                "name": "Décoration",
                "slug": "decor",
                "children": [
                    {"name": "Objets déco", "slug": "decor-objects"},
                    {"name": "Luminaires", "slug": "lighting"},
                    {"name": "Tableaux", "slug": "wall-art"},
                ],
            },
            {
                "name": "Linge de maison",
                "slug": "home-textiles",
                "children": [
                    {"name": "Draps", "slug": "bedsheets"},
                    {"name": "Nappes", "slug": "tablecloths"},
                    {"name": "Rideaux", "slug": "curtains"},
                ],
            },
            {
                "name": "Cuisine & Arts de la table",
                "slug": "kitchen-tableware",
                "children": [
                    {"name": "Ustensiles", "slug": "utensils"},
                    {"name": "Vaisselle", "slug": "tableware"},
                ],
            },
            {
                "name": "Rangement",
                "slug": "storage",
                "children": [
                    {"name": "Paniers", "slug": "baskets"},
                    {"name": "Boîtes", "slug": "boxes"},
                ],
            },
        ],
    },
    {
        "name": "Électronique",
        "slug": "electronics",
        "children": [
            {
                "name": "Téléphones & Accessoires",
                "slug": "phones-accessories",
                "children": [
                    {"name": "Smartphones", "slug": "smartphones"},
                    {"name": "Coques", "slug": "phone-cases"},
                    {"name": "Chargeurs", "slug": "chargers"},
                ],
            },
            {
                "name": "Audio",
                "slug": "audio",
                "children": [
                    {"name": "Écouteurs", "slug": "earphones"},
                    {"name": "Enceintes", "slug": "speakers"},
                ],
            },
            {
                "name": "Informatique",
                "slug": "computing",
                "children": [
                    {"name": "Ordinateurs", "slug": "computers"},
                    {"name": "Accessoires PC", "slug": "pc-accessories"},
                ],
            },
            {
                "name": "Électroménager",
                "slug": "appliances",
                "children": [
                    {"name": "Petit électroménager", "slug": "small-appliances"},
                    {"name": "Gros électroménager", "slug": "large-appliances"},
                ],
            },
        ],
    },
    {
        "name": "Livres et médias",
        "slug": "books-media",
        "children": [
            {
                "name": "Livres",
                "slug": "books",
                "children": [
                    {"name": "Romans", "slug": "novels"},
                    {"name": "Scolaire", "slug": "school-books"},
                    {"name": "Religieux", "slug": "religious-books"},
                ],
            },
            {
                "name": "Magazines",
                "slug": "magazines",
                "children": [
                    {"name": "Magazines", "slug": "magazines"},
                ],
            },
            {
                "name": "CD/DVD",
                "slug": "cd-dvd",
                "children": [
                    {"name": "CD/DVD", "slug": "cd-dvd"},
                ],
            },
        ],
    },
    {
        "name": "Loisirs et collections",
        "slug": "hobbies-collections",
        "children": [
            {
                "name": "Jeux & Jouets",
                "slug": "games-toys",
                "children": [
                    {"name": "Jeux de société", "slug": "board-games"},
                    {"name": "Jouets", "slug": "hobbies-toys"},
                ],
            },
            {
                "name": "Collections",
                "slug": "collectibles",
                "children": [
                    {"name": "Timbres", "slug": "stamps"},
                    {"name": "Pièces", "slug": "coins"},
                    {"name": "Figurines", "slug": "figurines"},
                ],
            },
            {
                "name": "Instruments de musique",
                "slug": "musical-instruments",
                "children": [
                    {"name": "Instruments de musique", "slug": "musical-instruments"},
                ],
            },
            {
                "name": "Art & Loisirs créatifs",
                "slug": "arts-crafts",
                "children": [
                    {"name": "Art & Loisirs créatifs", "slug": "arts-crafts"},
                ],
            },
        ],
    },
    {
        "name": "Sport",
        "slug": "sport",
        "children": [
            {
                "name": "Vêtements de sport",
                "slug": "sportswear",
                "children": [
                    {"name": "Homme", "slug": "sportswear-men"},
                    {"name": "Femme", "slug": "sportswear-women"},
                    {"name": "Enfant", "slug": "sportswear-kids"},
                ],
            },
            {
                "name": "Chaussures de sport",
                "slug": "sport-shoes",
                "children": [
                    {"name": "Chaussures de sport", "slug": "sport-shoes"},
                ],
            },
            {
                "name": "Équipements & Accessoires",
                "slug": "equipment-accessories",
                "children": [
                    {"name": "Fitness", "slug": "fitness"},
                    {"name": "Ballons", "slug": "balls"},
                    {"name": "Sacs de sport", "slug": "sport-bags"},
                ],
            },
        ],
    },
    {
        "name": "Alimentation",
        "slug": "food",
        "children": [
            {
                "name": "Plats préparés",
                "slug": "prepared-meals",
                "children": [
                    # Conservé tel quel pour ne pas casser la logique métier
                    # ni les tests qui s'attendent au slug "restauration".
                    {"name": "Restauration", "slug": "restauration"},
                ],
            },
        ],
    },
]


def _walk(node, level=1, parent_path=None):
    """Parcourt l'arbre et retourne chaque nœud avec son niveau et son chemin."""
    if parent_path is None:
        parent_path = []
    path = parent_path + [{"name": node["name"], "slug": node["slug"]}]
    yield {"node": node, "level": level, "path": path}
    for child in node.get("children", []):
        yield from _walk(child, level=level + 1, parent_path=path)


def get_leaf_paths():
    """Retourne un dict {slug_du_type: chemin_complet} pour les nœuds de niveau 3 (Type)."""
    paths = {}
    for root in CATEGORY_TREE:
        for item in _walk(root, level=1):
            if item["level"] == 3:
                paths[item["node"]["slug"]] = item["path"]
    return paths


def seed_category_tree(Category, active_only=False):
    """Crée l'arborescence complète de manière idempotente.

    `Category` peut être le modèle historique d'une migration ou le modèle actuel.
    Si `active_only` est True, seuls les nœuds actifs sont retournés.
    """
    created_nodes = []

    def create_node(node_data, level, parent):
        defaults = {
            "name": node_data["name"],
            "level": level,
            "order": node_data.get("order", 0),
            "is_active": node_data.get("is_active", True),
            "parent": parent,
        }
        node, _ = Category.objects.get_or_create(
            parent=parent,
            slug=node_data["slug"],
            defaults=defaults,
        )
        # Synchronise les champs non-uniques en cas de changement de libellé.
        if node.name != defaults["name"] or node.order != defaults["order"]:
            node.name = defaults["name"]
            node.order = defaults["order"]
            node.save(update_fields=["name", "order"])
        created_nodes.append(node)
        for child in node_data.get("children", []):
            create_node(child, level=level + 1, parent=node)

    for root in CATEGORY_TREE:
        create_node(root, level=1, parent=None)

    if active_only:
        return [n for n in created_nodes if n.is_active]
    return created_nodes
