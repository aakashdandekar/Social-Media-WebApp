import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid3X3, Heart, UserPlus, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPublicProfile, followUser } from '../services/api';
import { IKImage, IKVideo } from 'imagekitio-react';
import { getIKPath } from '../utils/imagekitHelpers';
import './Profile.css';

function PublicProfile() {
  const { username } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('vibely_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.user_id || '');
      }
    } catch {
      // ignore
    }

    fetchProfile();
  }, [username, isAuthenticated, navigate]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getPublicProfile(username);
      setUser(res.data.user);
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error('Profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    try {
      const res = await followUser(user._id);
      if (res.data.message.includes('followed')) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-loading-spinner" />
          <span className="profile-loading-text">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-no-posts">User not found.</div>
      </div>
    );
  }

  const isOwnProfile = user._id === currentUserId;

  return (
    <div className="profile-page" id="public-profile-page">
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar">
            {(user.userId || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1 className="profile-username">{user.userId}</h1>

            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-value">{posts.length}</span>
                <span className="profile-stat-label">Posts</span>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="profile-actions">
                <button
                  className={`profile-btn ${isFollowing ? 'following' : 'primary'}`}
                  onClick={handleFollow}
                  id="follow-btn"
                >
                  {isFollowing ? (
                    <><UserCheck size={14} /> Following</>
                  ) : (
                    <><UserPlus size={14} /> Follow</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="profile-posts-section">
        <h2 className="profile-posts-title">
          <Grid3X3 size={18} /> Posts
        </h2>

        {posts.length === 0 ? (
          <div className="profile-no-posts">
            <p>No posts yet.</p>
          </div>
        ) : (
          <div className="profile-posts-grid">
            {posts.map((post) => (
              <div key={post._id} className="profile-post-thumb">
                {post.filetype === 'video' ? (
                  <IKVideo path={getIKPath(post.url)} />
                ) : (
                  <IKImage 
                    path={getIKPath(post.url)} 
                    alt={post.caption || 'Post'} 
                    loading="lazy" 
                    transformation={[{ width: '400', height: '400', cropMode: 'maintain_ratio' }]} 
                  />
                )}
                <div className="profile-post-overlay">
                  <div className="profile-post-stat">
                    <Heart size={18} fill="white" /> {post.likes || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicProfile;
