import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Plus, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { searchUser } from '../services/api';
import './Navbar.css';

function Navbar() {
  const { isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      try {
        const res = await searchUser(searchQuery.trim());
        if (res.data['User Found']) {
          setSearchResult(res.data['User Found']);
        } else {
          setSearchResult(null);
        }
        setShowSearchResults(true);
      } catch {
        setSearchResult(null);
        setShowSearchResults(true);
      }
    }
  };

  const handleLogout = () => {
    logoutUser();
    setShowDropdown(false);
    navigate('/login');
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">Vibely</Link>

        {isAuthenticated && (
          <div className="navbar-search" ref={searchRef}>
            <Search className="navbar-search-icon" />
            <input
              id="search-input"
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
            {showSearchResults && (
              <div className="navbar-search-results">
                {searchResult ? (
                  <Link
                    to={`/user/${searchResult}`}
                    className="navbar-search-result-item"
                    onClick={() => {
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                  >
                    <User size={16} />
                    {searchResult}
                  </Link>
                ) : (
                  <div className="navbar-search-no-result">No user found</div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <button
                className="navbar-btn primary"
                id="create-post-btn"
                onClick={() => navigate('/create')}
              >
                <Plus className="navbar-btn-icon" />
                <span>Create</span>
              </button>

              <div className="navbar-dropdown" ref={dropdownRef}>
                <div
                  className="navbar-avatar"
                  id="avatar-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  U
                </div>
                {showDropdown && (
                  <div className="navbar-dropdown-menu">
                    <Link
                      to="/profile"
                      className="navbar-dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <User size={16} /> My Profile
                    </Link>
                    <button
                      className="navbar-dropdown-item danger"
                      id="logout-btn"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                className="navbar-btn"
                id="login-nav-btn"
                onClick={() => navigate('/login')}
              >
                Log in
              </button>
              <button
                className="navbar-btn primary"
                id="signup-nav-btn"
                onClick={() => navigate('/register')}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
