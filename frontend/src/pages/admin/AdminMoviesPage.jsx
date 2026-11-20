import { useEffect, useState } from 'react';
import api from '../../api/api';
import AdminLayout from '../../components/layouts/AdminLayout';

const AdminMoviesPage = () => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    api.get('/movies').then((res) => setMovies(Array.isArray(res.data) ? res.data : [])).catch(() => setMovies([]));
  }, []);

  return (
    <AdminLayout>
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
        <h2 className="text-xl font-semibold text-white">Manage movies</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {movies.map((movie) => (
            <div key={movie._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="font-medium text-white">{movie.title}</p>
              <p className="mt-2 text-sm text-slate-400">{movie.description}</p>
              <p className="mt-2 text-sm text-fuchsia-300">{movie.genre}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMoviesPage;
