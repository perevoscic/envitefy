export default function ThemeCard({
  theme,
  selected,
  onSelect,
}: {
  theme: any;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`border rounded-md overflow-hidden transition 
        ${selected ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-200"}`}
    >
      <img
        src={theme.thumbnail}
        alt={theme.name}
        className="w-full h-20 object-cover"
      />
      <div className="p-2 text-left">
        <div className="text-sm font-medium">{theme.name}</div>
        <div className="text-xs uppercase text-gray-500">{theme.category}</div>
      </div>
    </button>
  );
}
