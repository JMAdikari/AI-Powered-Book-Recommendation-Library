import BookCard from "./BookCard"
import { SkeletonCard } from "../ui/Skeleton"

/**
 * Responsive book grid used on Search, Home, and anywhere books are listed.
 * cols: "default" (2→3→4→5) | "compact" (2→3→6) | number (legacy)
 */
export default function BookGrid({
  books = [],
  loading = false,
  skeletonCount = 10,
  cols = "default",
  onSave,
  onFavorite,
}) {
  const gridClass =
    cols === "compact"
      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"
      : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (!books.length) return null

  return (
    <div className={gridClass}>
      {books.map(book => (
        <BookCard
          key={book.external_id || book.id}
          book={book}
          onSave={onSave}
          onFavorite={onFavorite}
        />
      ))}
    </div>
  )
}
