import BookCard from "./BookCard"
import { SkeletonCard } from "../ui/Skeleton"

export default function BookGrid({ books, loading, onSave, onFavorite, cols = 3 }) {
  const gridClass = {
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  }[cols] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

  if (loading) {
    return (
      <div className={`grid ${gridClass} gap-4`}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {books.map((book) => (
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
