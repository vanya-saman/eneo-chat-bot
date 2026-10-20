import {ACCEPT_ATTRIBUTE, MAX_FILES} from "../hooks/useFileUpload.js";

/** Bottom row of the input area: hidden file input, attachment count, attach button and send button. */
export default function InputActions(props) {
    return <div className="input-actions">
        <div className="input-actions-container">
            <input
                ref={props.ref}
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                onChange={props.onFileChange}
                multiple
                hidden
            />
            {props.processing ? (
                <span className="attachment-count" role="status">
                    Förbereder bild…
                </span>
            ) : props.attachments.length > 0 && (
                <span className="attachment-count">
                    {props.attachments.length}/{MAX_FILES} filer
                </span>
            )}
            <button
                type="button"
                className="attach-button"
                onClick={props.onAttachClick}
                disabled={props.loading || !props.canAddMore}
                title={props.canAddMore ? undefined : `Högst ${MAX_FILES} filer per meddelande`}
            >
                Bifoga fil
            </button>

            <button
                onClick={props.onSend}
                disabled={(!props.input.trim() && props.files.length === 0) || props.loading || props.processing}
            >
                Skicka
            </button>
        </div>
    </div>
}