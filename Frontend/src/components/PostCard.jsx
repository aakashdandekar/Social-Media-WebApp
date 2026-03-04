import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Trash2, Send, X } from 'lucide-react';
import { likePost, addComment, deleteComment, deletePost } from '../services/api';
import { IKImage, IKVideo } from 'imagekitio-react';
import { getIKPath } from '../utils/imagekitHelpers';
import './PostCard.css';

function PostCard({ post, currentUserId, onPostDeleted, showDeleteBtn = false }) {
  const [likes, setLikes] = useState(post.likes || 0);
  const [liked, setLiked] = useState(
    post.liked_by?.includes(currentUserId) || false
  );
  const [animateHeart, setAnimateHeart] = useState(false);
  const [comments, setComments] = useState(post.comments || {});
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async () => {
    try {
      setLiked(!liked);
      setLikes(liked ? likes - 1 : likes + 1);
      if (!liked) {
        setAnimateHeart(true);
        setTimeout(() => setAnimateHeart(false), 600);
      }
      await likePost(post._id);
    } catch (err) {
      console.error('Like error:', err);
      setLiked(liked);
      setLikes(likes);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addComment(post._id, commentText.trim());
      setComments({
        ...comments,
        [currentUserId]: { text: commentText.trim() },
      });
      setCommentText('');
      setShowComments(true);
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async () => {
    try {
      await deleteComment(post._id);
      const updated = { ...comments };
      delete updated[currentUserId];
      setComments(updated);
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(post._id);
      onPostDeleted?.(post._id);
    } catch (err) {
      console.error('Delete post error:', err);
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const commentEntries = Object.entries(comments);

  return (
    <article className="post-card" id={`post-${post._id}`}>
      <div className="post-card-header">
        <div className="post-card-avatar">
          {(post.username || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="post-card-user-info">
          <Link to={`/user/${post.username || ''}`} className="post-card-username">
            {post.username || 'User'}
          </Link>
          <span className="post-card-time">{timeAgo(post.created_at)}</span>
        </div>
        {showDeleteBtn && (
          <button className="post-card-delete" onClick={handleDeletePost} title="Delete post">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {post.url && (
        <div className="post-card-media">
          {post.filetype === 'video' ? (
            <IKVideo path={getIKPath(post.url)} controls />
          ) : (
            <IKImage 
              path={getIKPath(post.url)} 
              alt={post.caption || 'Post'} 
              loading="lazy" 
              transformation={[{ width: '900' }]} 
            />
          )}
        </div>
      )}

      <div className="post-card-body">
        {post.caption && (
          <p className="post-card-caption">
            <strong>{post.username || 'User'}</strong>
            {post.caption}
          </p>
        )}

        <div className="post-card-actions">
          <button
            className={`post-action-btn ${liked ? 'liked' : ''}`}
            onClick={handleLike}
            id={`like-btn-${post._id}`}
          >
            <Heart
              size={20}
              fill={liked ? 'currentColor' : 'none'}
              className={animateHeart ? 'heart-animate' : ''}
            />
            {likes}
          </button>

          <button
            className="post-action-btn"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={20} />
            {commentEntries.length}
          </button>
        </div>

        {showComments && commentEntries.length > 0 && (
          <div className="post-card-comments">
            {commentEntries.map(([userId, comment]) => (
              <div key={userId} className="post-comment">
                <span className="post-comment-user">{userId === currentUserId ? 'You' : userId.slice(0, 6)}:</span>
                <span className="post-comment-text">{comment.text}</span>
                {userId === currentUserId && (
                  <button className="post-comment-delete" onClick={handleDeleteComment}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="post-card-comment-input">
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
          />
          <button onClick={handleComment} disabled={!commentText.trim() || submitting}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default PostCard;
