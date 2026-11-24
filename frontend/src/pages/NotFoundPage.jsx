import { Link } from 'react-router-dom';
import AnimatedReveal from '../components/AnimatedReveal';

const NotFoundPage = () => {
  return (
    <AnimatedReveal
      delay={0.1}
      duration={0.6}
      y={20}
      className="mx-auto max-w-xl text-center rounded-[2.5rem] border border-slate-200 bg-white/85 p-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
    >
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 shadow-inner">
        <span className="text-4xl" role="img" aria-label="tent">🎪</span>
      </div>

      <span className="inline-block rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold tracking-wider text-indigo-700 uppercase">
        404 Error
      </span>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Page Not Found
      </h1>

      <p className="mt-3 text-base text-slate-600">
        The page you are looking for doesn't exist, has been removed, or the link may be broken.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 sm:w-auto"
        >
          Return to Home
        </Link>
        <Link
          to="/events"
          className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          Explore Events
        </Link>
      </div>
    </AnimatedReveal>
  );
};

export default NotFoundPage;
