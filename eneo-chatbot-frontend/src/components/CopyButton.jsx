export default function CopyButton(props) {
    const text = props.text;

    const [isCopied, setCopied] = useState(false);

    useEffect(() => {
        if (!isCopied) {
            return;
        }

        const countDown = setInterval(() => {
            setCopied(false);
        }, 2000);

        return () => clearInterval(countDown);
    }, [isCopied]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);

            setTimeout(() =>
                    setCopied(false),
                2000);

        } catch (error) {
            console.error("Kunde inte kopiera text.", error);
        }
    };

    return(
        <div className="copy-button-container">
            <img className="copy-icon" src={isCopied ? copyOk : copyIcon} alt="copy_button" onClick={handleCopy}/>
        </div>
);


}
import {useState, useEffect} from "react";
import './CopyButton.css';
import copyIcon from "../assets/copy_button.png"
import copyOk from "../assets/copy_ok.png"
