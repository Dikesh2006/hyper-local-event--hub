import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import api from '../../api/api';
import UserLayout from '../../components/layouts/UserLayout';

const UserReviewsPage = () => {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get(`/reviews?targetType=user&target=${user._id}`).then((res) => setReviews(res.data)).catch(() => setReviews([]));
  }, [user]);

  return (
    <UserLayout>
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
        <h2 className="text-xl font-semibold text-white">My reviews</h2>
        <div className="mt-6 grid gap-4">
          {reviews.length ? reviews.map((review) => (
            <div key={review._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="font-medium text-white">{review.comment || 'Great experience'}</p>
              <p className="mt-2 text-sm text-slate-400">Rating: {review.rating}/5</p>
            </div>
          )) : <p className="text-sm text-slate-400">No reviews submitted yet.</p>}
        </div>
      </div>
    </UserLayout>
  );
};

export default UserReviewsPage;
