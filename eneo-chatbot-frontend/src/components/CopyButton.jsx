import {useEffect, useState} from "react";
import "./CopyButton.css";
import copyIcon from "../assets/copy_button.png";
import copyOk from "../assets/copy_ok.png";

const COPIED_RESET_DELAY_MS = 2000;

function CopyButton({text}) {
    const [isCopied, setCopied] = useState(false);

    useEffect(() => {
        if (!isCopied) return;

        const timeout = setTimeout(() => setCopied(false), COPIED_RESET_DELAY_MS);
        return () => clearTimeout(timeout);
    }, [isCopied]);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
        } catch (error) {
            console.error("Kunde inte kopiera text.", error);
        }
    }

    return (
        <div className="copy-button-container">
            <img
                className="copy-icon"
                src={isCopied ? copyOk : copyIcon}
                alt="copy_button"
                onClick={handleCopy}
            />
        </div>
    );
}

export default CopyButton;
