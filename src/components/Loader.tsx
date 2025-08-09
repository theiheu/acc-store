export default function Loader({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="w-full flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3 text-gray-700 dark:text-gray-300">
        <div className="h-8 w-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" aria-hidden />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}

