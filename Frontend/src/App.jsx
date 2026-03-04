import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SetupProfile from "./pages/SetupProfile";
import CreatePost from "./pages/CreatePost";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import { IKContext } from 'imagekitio-react';
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <IKContext urlEndpoint="https://ik.imagekit.io/22starmaster">
        <BrowserRouter>
          <Navbar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/setup-profile" element={<SetupProfile />} />
              <Route path="/create" element={<CreatePost />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:username" element={<PublicProfile />} />
            </Routes>
          </main>
        </BrowserRouter>
      </IKContext>
    </AuthProvider>
  );
}

export default App;