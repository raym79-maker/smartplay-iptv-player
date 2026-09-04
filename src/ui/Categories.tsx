import { useAppStore } from '../store/useAppStore';

export function Categories() {
  const categories = useAppStore((s) => s.categories);
  const selectedCategoryId = useAppStore((s) => s.selectedCategoryId);
  const setSelectedCategory = useAppStore((s) => s.setSelectedCategory);
  const setView = useAppStore((s) => s.setView);
  const channels = useAppStore((s) => s.channels);
  const favoriteIds = useAppStore((s) => s.favoriteIds);
  const view = useAppStore((s) => s.view);

  const countFor = (catId: string) =>
    channels.filter((c) => c.categoryId === catId).length;

  return (
    <nav className="categories" aria-label="Categories">
      <button
        type="button"
        className={
          view === 'favorites' ? 'cat-item active fav' : 'cat-item fav'
        }
        onClick={() => {
          setView('favorites');
        }}
      >
        <span>★ Favorites</span>
        <span className="badge">{favoriteIds.length}</span>
      </button>

      <div className="cat-section-label">Categories</div>
      <ul className="cat-list">
        {categories.map((cat) => (
          <li key={cat.id}>
            <button
              type="button"
              className={
                view === 'browse' && selectedCategoryId === cat.id
                  ? 'cat-item active'
                  : 'cat-item'
              }
              onClick={() => {
                setSelectedCategory(cat.id);
                setView('browse');
              }}
            >
              <span className="cat-name">{cat.name}</span>
              <span className="badge">{countFor(cat.id)}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
