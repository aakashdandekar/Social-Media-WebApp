import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, X, Check, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadPost } from '../services/api';
import './CreatePost.css';

function CreatePost() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const removeFile = () => {
    setFile(null);
    setPreview('');
  };

  const handleSubmit = async () => {
    if (!file || loading) return;
    setLoading(true);
    try {
      await uploadPost(file, caption);
      setSuccess(true);
    } catch (err) {
      console.error('Upload error:', err);
      alert(err.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="create-page">
        <div className="create-card">
          <div className="create-success">
            <div className="create-success-icon">
              <Check size={32} />
            </div>
            <h2>Post uploaded!</h2>
            <p>Your post is now live for everyone to see.</p>
            <div className="create-success-actions">
              <Link to="/" className="create-success-btn primary">
                <Home size={16} /> Go to Feed
              </Link>
              <button
                className="create-success-btn secondary"
                onClick={() => {
                  setSuccess(false);
                  setFile(null);
                  setPreview('');
                  setCaption('');
                }}
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-page" id="create-post-page">
      <h1>Create Post</h1>
      <div className="create-card">
        <div className={`create-upload-area ${file ? 'has-file' : ''}`}>
          {!file ? (
            <>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                id="file-upload"
              />
              <div className="create-upload-placeholder">
                <div className="create-upload-icon">
                  <Upload size={24} />
                </div>
                <h3>Upload a photo or video</h3>
                <p>Click or drag &amp; drop</p>
              </div>
            </>
          ) : (
            <>
              {file.type.startsWith('video/') ? (
                <video src={preview} controls className="create-preview" />
              ) : (
                <img src={preview} alt="Preview" className="create-preview" />
              )}
              <button className="create-remove-btn" onClick={removeFile}>
                <X size={16} />
              </button>
            </>
          )}
        </div>

        <div className="create-caption">
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            id="caption-input"
          />
        </div>

        <button
          className="create-submit"
          id="submit-post"
          onClick={handleSubmit}
          disabled={!file || loading}
        >
          {loading ? 'Uploading...' : 'Share Post'}
        </button>

        {loading && (
          <div className="create-progress">
            <div className="create-progress-spinner" />
            Uploading your post...
          </div>
        )}
      </div>
    </div>
  );
}

export default CreatePost;
