/** Scrollable list of chat messages, with a loading text before the first message and a typing indicator while waiting for the AI. */

export default function MessagesField(props) {
    return <div className="messages" ref={props.ref}>
        {props.messages.length === 0 && (
            <p><i>Laddar...</i></p>
        )}
        {props.messages.map(props.callbackfn)}

        {props.loading && (
            <div className="message ai">
                <div className="bubble typing">
                    Tänker...
                </div>
            </div>
        )}

        <div/>
    </div>
}