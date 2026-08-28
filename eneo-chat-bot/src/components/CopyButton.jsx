export default function CopyButton(props) {
    const darkMode = props.darkMode;
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

    function resolveCopyIcon(){
        if (isCopied) {
            return darkMode ? copyOkDark : copyOk;
        } else {
            return darkMode ? copyIconDark : copyIcon;
        }
    }

    return(
        <div className="copy-button-container">
            <img className="copy-icon" src={resolveCopyIcon()} alt="copy_button" onClick={handleCopy}/>
        </div>
);

    // return (<button className="copy-button" onClick={handleCopy}>
    //         {isCopied ? "✅" : "📋"}
    //     </button>
    // );
}
import {useState, useEffect} from "react";
import './CopyButton.css';
import copyIcon from "../assets/copy_button.png"
import copyIconDark from "../assets/copy_button_dark.png"
import copyOk from "../assets/copy_ok.png"

import copyOkDark from "../assets/copy_ok_dark.png"
