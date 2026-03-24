import React, { useState } from "react";
import "./RegisterTeam.css";
import { useNavigate } from "react-router-dom";

const RegisterTeam = () => {
    const [formData, setFormData] = useState({
        teamName: "",
        player1: "",
        player2: "",
    });

    const [showConfirm, setShowConfirm] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.teamName || !formData.player1 || !formData.player2) {
            alert("Please fill all fields");
            return;
        }

        setShowConfirm(true);
    };
    const navigate = useNavigate();
    const confirmSubmit = async () => {
        const payload = {
            event: "Next Node",
            teamName: formData.teamName,
            players: [
                { name: formData.player1 },
                { name: formData.player2 },
            ],
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message);
                return;
            }

            // ✅ Redirect after success
            navigate("/round1");

        } catch (err) {
            console.error(err);
            alert("❌ Server error");
        }
    };

    return (
        <div className="page">

            {/* HERO */}
            <div className="hero">
                <h1 className="event-title">NEXT NODE</h1>
                <p className="event-sub">Technical Challenge • Problem Solving</p>
            </div>

            {/* CONTENT */}
            <div className="content">

                {/* EVENT INFO */}
                <div className="event-info">
                    <h2>About the Event</h2>

                    <p className="description">
                        <strong>Next Node</strong> is a sequential clue-based technical challenge where teams must solve interconnected problems in a structured progression. The event tests logical thinking, technical aptitude, and systematic problem-solving skills.
                    </p>

                    <div className="info-grid">
                        <div>
                            <h4>Type</h4>
                            <p>MCA Students Only</p>
                        </div>
                        <div>
                            <h4>Category</h4>
                            <p>Technical</p>
                        </div>
                        <div>
                            <h4>Eligibility</h4>
                            <p>Team Only</p>
                        </div>
                        <div>
                            <h4>Team Size</h4>
                            <p>2 Members (1 Laptop)</p>
                        </div>
                    </div>

                    <h3 className="rules-title">Rules</h3>
                    <ul className="rules-list">
                        <li>Exactly two participants per team.</li>
                        <li>Only one laptop allowed.</li>
                        <li>Must solve clues in sequence.</li>
                        <li>No refreshing or URL manipulation.</li>
                        <li>No answer sharing.</li>
                        <li>Follow coordinator instructions.</li>
                        <li>Decisions are final.</li>
                    </ul>
                </div>

                {/* REGISTRATION */}
                <div className="card">
                    <h2>Register Your Team</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Team Name</label>
                            <input
                                type="text"
                                name="teamName"
                                value={formData.teamName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <label>Player 1</label>
                            <input
                                type="text"
                                name="player1"
                                value={formData.player1}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <label>Player 2</label>
                            <input
                                type="text"
                                name="player2"
                                value={formData.player2}
                                onChange={handleChange}
                            />
                        </div>

                        <button type="submit" className="submit-btn2">
                            Register
                        </button>
                    </form>
                </div>

            </div>

            {/* DIALOG */}
            {showConfirm && (
                <div className="overlay">
                    <div className="dialog">
                        <h3>Confirm Registration</h3>
                        <p>
                            Register <strong>{formData.teamName}</strong> for{" "}
                            <strong>Next Node</strong>?
                        </p>

                        <div className="dialog-actions">
                            <button className="yes" onClick={confirmSubmit}>
                                Confirm
                            </button>
                            <button className="no" onClick={() => setShowConfirm(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterTeam;
