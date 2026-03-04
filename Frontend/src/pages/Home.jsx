import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFeed } from '../services/api';
import PostCard from '../components/PostCard';
import './Home.css';

function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Decode user_id from JWT
    try {
      const token = localStorage.getItem('vibely_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.user_id || '');
      }
    } catch {
      // ignore
    }

    fetchFeed();
  }, [isAuthenticated, navigate]);

  const fetchFeed = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getFeed();
      setPosts(res.data.feed || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="feed-page">
        <div className="feed-loading">
          <div className="feed-loading-spinner" />
          <span className="feed-loading-text">Loading your feed...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-page">
        <div className="feed-error">
          <p>{error}</p>
          <button onClick={fetchFeed}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-page" id="feed-page">
      {posts.length === 0 ? (
        <div className="feed-empty">
          <div className="feed-empty-icon">
            <Compass size={36} />
          </div>
          <h2>Nothing here yet</h2>
          <p>Follow people or check back later to see posts!</p>
        </div>
      ) : (
        <div className="feed-list">
          {posts.map((post, index) => (
            <div key={post._id} style={{ animationDelay: `${index * 0.08}s` }}>
              <PostCard
                post={post}
                currentUserId={currentUserId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;