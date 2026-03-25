import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Round2 from "./components/Round2";
import ShadowTrace from "./components/ShadowTrace";
import HiddenMessage from "./components/HiddenMessage";
import Round1 from "./components/Round1";
import TreasureHunt2 from "./components/TreasureHunt2";
import Broken from "./components/Broken";
import RegisterTeam from "./components/RegisterTeam";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<RegisterTeam />} />
        <Route path="/round1" element={<Round1 />} />
        <Route path="/round2" element={<Round2 />} />
        <Route path="/shadow-trace" element={<ShadowTrace />} />
        <Route path="/hidden-message" element={<HiddenMessage />} />
        <Route path="/treasure-hunt-2" element={<TreasureHunt2 />} />
        <Route path="/broken" element={<Broken />} />
      </Routes>
    </Router>
  );
}