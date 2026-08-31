function MessageInput({value, onChange, onSend, disabled}) {
    function handleKeyDown(event) {
        if (event.key === "Enter") {
            onSend();
        }
    }

    return (
        <div className="input-area">
            <textarea
                value={value}
                placeholder="Ställ en fråga..."
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
            />

            <div className="input-actions">
                <button onClick={onSend} disabled={!value.trim() || disabled}>
                    Skicka
                </button>
            </div>
        </div>
    );
}

export default MessageInput;
