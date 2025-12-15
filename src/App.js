import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";

function App() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* LEFT THIN NAVBAR */}
      <nav
        style={{
          width: "80px",          // thin
          backgroundColor: "#000",
          display: "flex",
          flexDirection: "column",
          paddingTop: "20px"
        }}
      >
        <Link to="/" style={linkStyle}>Home</Link>
        <Link to="/about" style={linkStyle}>About</Link>
        <Link to="/contact" style={linkStyle}>Contact</Link>
      </nav>

      {/* PAGE CONTENT */}
      <div style={{ flex: 1, padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
    </div>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "10px 8px",
  fontSize: "12px",
  textAlign: "left"
};

export default App;
