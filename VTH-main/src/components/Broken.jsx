import { useState, useEffect } from "react";
import "./style.css";

export default function BrokenWebsite() {
    const [clicks, setClicks] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [input, setInput] = useState("");
    const [message, setMessage] = useState("Nothing works here...");

    useEffect(() => {
        const timer = setInterval(() => {
            setMessage((prev) => prev.split("").reverse().join(""));
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    const handleClick = () => {
        setClicks(clicks + 1);
        if (clicks === 3) {
            setShowHint(true);
        }
    };

    const checkAnswer = () => {
        if (input.toLowerCase() === "escape") {
            alert("You escaped... or did you?");
        } else {
            setMessage("Wrong. Look where things vanish...");
        }
    };

    return (
        <div className="container">
            <h1 className="title">Welcome???</h1>

            <p className="glitch-text">{message}</p>

            <button onClick={handleClick} className="btn">
                Do NOT click
            </button>

            {clicks > 5 && (
                <p className="annoying-text">why are you still clicking...</p>
            )}

            {showHint && (
                <div className="hint">
                    Hint: The answer is hidden where things disappear...
                </div>
            )}

            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="enter something..."
                className="input"
            />

            <button onClick={checkAnswer} className="submit-btn">
                Submit
            </button>

            <div className="fake-links">
                <span>About</span>
                <span>Help</span>
                <span>Contact</span>
            </div>

            {/* hidden answer */}
            <p className="hidden">escape</p>
        </div>
    );
}

