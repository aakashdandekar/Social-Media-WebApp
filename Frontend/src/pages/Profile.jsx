import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, Heart, Edit3, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, updateProfile, deletePost } from '../services/api';
import { IKImage, IKVideo } from 'imagekitio-react';
import { getIKPath } from '../utils/imagekitHelpers';
import './Profile.css';

function Profile() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newBio, setNewBio] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [isAuthenticated, navigate]);

  const fetchProfile = async () => {
    try {
      const res = await getMyProfile();
      setUser(res.data.user);
      setProfileData(res.data['profile-data']);
      setPosts(res.data.posts || []);
      setNewBio(res.data['profile-data']?.bio || '');
    } catch (err) {
      console.error('Profile error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBio = async () => {
    try {
      await updateProfile(newBio);
      setProfileData((prev) => ({ ...prev, bio: newBio }));
      setEditing(false);
    } catch (err) {
      console.error('Update bio error:', err);
      alert(err.response?.data?.detail || 'Failed to update bio');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(postId);
      setPosts(posts.filter((p) => p._id !== postId));
    } catch (err) {
      console.error('Delete post error:', err);
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
        <div className="profile-no-posts">Could not load profile.</div>
      </div>
    );
  }

  return (
    <div className="profile-page" id="my-profile-page">
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar">
            {(user.userId || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1 className="profile-username">{user.userId}</h1>
            <p className="profile-email">{user.email}</p>
            {profileData?.bio && !editing && (
              <p className="profile-bio">{profileData.bio}</p>
            )}

            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-value">{posts.length}</span>
                <span className="profile-stat-label">Posts</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">
                  {profileData?.followers?.length || 0}
                </span>
                <span className="profile-stat-label">Followers</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">
                  {profileData?.following?.length || 0}
                </span>
                <span className="profile-stat-label">Following</span>
              </div>
            </div>

            <div className="profile-actions">
              <button
                className="profile-btn secondary"
                onClick={() => setEditing(!editing)}
              >
                <Edit3 size={14} />
                {editing ? 'Cancel' : 'Edit Bio'}
              </button>
              <button
                className="profile-btn primary"
                onClick={() => navigate('/create')}
              >
                <Camera size={14} />
                New Post
              </button>
            </div>

            {editing && (
              <div className="profile-edit-bio">
                <textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Write something about yourself..."
                  id="edit-bio-input"
                />
                <button className="save-btn" onClick={handleUpdateBio}>
                  Save
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
            <p>No posts yet. Share your first moment!</p>
          </div>
        ) : (
          <div className="profile-posts-grid">
            {posts.map((post) => (
              <div
                key={post._id}
                className="profile-post-thumb"
                onClick={() => handleDeletePost(post._id)}
              >
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

export default Profile;
