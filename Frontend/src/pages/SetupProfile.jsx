import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setupProfile } from '../services/api';
import './SetupProfile.css';

function SetupProfile() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async () => {
    if (!bio.trim() || loading) return;
    setLoading(true);
    try {
      await setupProfile(bio.trim());
      navigate('/');
    } catch (err) {
      console.error('Setup error:', err);
      // If profile already exists, just go to home
      if (err.response?.status === 400) {
        navigate('/');
      } else {
        alert(err.response?.data?.detail || 'Failed to setup profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-page" id="setup-profile-page">
      <div className="setup-card">
        <h1>Almost there!</h1>
        <p>Tell the world a little about yourself</p>

        <textarea
          placeholder="Write a short bio..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          id="setup-bio-input"
        />

        <button
          className="setup-submit"
          onClick={handleSubmit}
          disabled={!bio.trim() || loading}
          id="setup-submit-btn"
        >
          {loading ? 'Setting up...' : 'Complete Setup'}
        </button>

        <button className="setup-skip" onClick={() => navigate('/')}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

export default SetupProfile;
