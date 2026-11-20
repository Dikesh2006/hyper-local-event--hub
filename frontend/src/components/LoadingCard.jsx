const LoadingCard = () => (
  <div className="animate-pulse rounded-3xl bg-slate-900/80 p-8 shadow-glass">
    <div className="mb-4 h-6 w-3/5 rounded-full bg-slate-700" />
    <div className="mb-6 h-40 rounded-2xl bg-slate-800" />
    <div className="flex flex-wrap gap-3">
      <div className="h-10 w-24 rounded-full bg-slate-700" />
      <div className="h-10 w-24 rounded-full bg-slate-700" />
      <div className="h-10 w-24 rounded-full bg-slate-700" />
    </div>
  </div>
);

export default LoadingCard;
