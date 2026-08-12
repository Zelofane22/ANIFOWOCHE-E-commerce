export function findCategoryPath(tree, id) {
  if (!id) return null;
  const targetId = String(id);
  for (const l1 of tree) {
    if (String(l1.id) === targetId) {
      return { l1, l2: null, l3: null };
    }
    for (const l2 of l1.children || []) {
      if (String(l2.id) === targetId) {
        return { l1, l2, l3: null };
      }
      for (const l3 of l2.children || []) {
        if (String(l3.id) === targetId) {
          return { l1, l2, l3 };
        }
      }
    }
  }
  return null;
}
