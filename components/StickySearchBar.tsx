"use client"

interface Props {
  visible: boolean
  keyword: string
  activeFilterCount: number
  resultCount: number
  onRefineSearch: () => void
}

export default function StickySearchBar({
  visible,
  keyword,
  activeFilterCount,
  resultCount,
  onRefineSearch,
}: Props) {
  if (!visible || resultCount === 0) return null

  return (
    <div className="fixed left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm"
      style={{ top: 0 }}
    >
      <div className="max-w-480 mx-auto px-3 sm:px-4 lg:px-6 py-2 flex items-center gap-2 flex-wrap">
        {/* Keyword pill */}
        {keyword && (
          <span className="px-3 py-0.5 bg-green-50 text-[#166534] border border-green-200 rounded-full text-xs font-bold">
            &ldquo;{keyword}&rdquo;
          </span>
        )}

        {/* Filter count pill */}
        {activeFilterCount > 0 && (
          <span className="px-3 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
          </span>
        )}

        {/* Result count */}
        <span className="text-xs font-semibold text-gray-500">
          {resultCount.toLocaleString()} result{resultCount !== 1 ? "s" : ""}
        </span>

        {/* Refine button */}
        <button
          onClick={onRefineSearch}
          className="ml-auto px-3 py-1.5 bg-[#166534] text-white text-xs font-bold rounded-lg hover:bg-[#14532d] transition-colors"
        >
          ↑ Refine Search
        </button>
      </div>
    </div>
  )
}
