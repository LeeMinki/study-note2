export default function SearchBar({ value, onChange }) {
  return (
    <label className="searchBar">
      <span className="searchBarLabel">Search</span>
      <input
        className="searchInput"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search title or content"
      />
    </label>
  );
}
