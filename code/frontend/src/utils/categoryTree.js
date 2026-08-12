export function findCategoryPath(tree, leafId) {
  if (!leafId) return null;
  const targetId = String(leafId);
  for (const l1 of tree) {
    for (const l2 of l1.children || []) {
      for (const l3 of l2.children || []) {
        if (String(l3.id) === targetId) {
          return { l1, l2, l3 };
        }
      }
    }
  }
  return null;
}
