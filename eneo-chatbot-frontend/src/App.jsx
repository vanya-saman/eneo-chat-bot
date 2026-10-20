import {useRef} from 'react'
import './App.css'
import Message from "./components/Message.jsx";
import {ACCEPT_ATTRIBUTE, MAX_FILES, useFileUpload} from "./hooks/useFileUpload.js";
import {useChat} from "./hooks/useChat.js";
import MessagesField from "./components/MessagesField.jsx";
import InputActions from "./components/InputActions.jsx";
import Attachments from "./components/Attachments.jsx";

function App() {


    const {
        attachments,
        files,
        canAddMore,
        isProcessing,
        error: uploadError,
        isDragging,
        addFiles,
        removeFile,
        clearFiles
    } = useFileUpload();

    const {
        sendMessage,
        messagesRef,
        messages,
        scrollToBottom,
        isLoading,
        setInput,
        handleFileInputChange,
        aiIcon,
        aiName,
        input
    } = useChat(clearFiles, isProcessing, files, addFiles)

    const fileInputRef = useRef(null);


    function handleKeyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    }

    return (
        <main className="app">
            <section className={`chat${isDragging ? " dragging" : ""}`}>

                <MessagesField
                    ref={messagesRef}
                    messages={messages}
                    callbackfn={(message) => (
                        <Message
                            key={message.id}
                            message={message}
                            aiIcon={aiIcon}
                            aiName={aiName}
                            onImageLoad={scrollToBottom}
                        />
                    )} loading={isLoading}/>

                <div className="input-area">

                    <textarea
                        value={input}
                        placeholder="Ställ en fråga..."
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={handleKeyDown}
                    />

                    {attachments.length > 0 && (
                        <Attachments
                            attachments={attachments}
                            removeFile={removeFile}
                        />
                    )}

                    {uploadError && (
                        <p className="upload-error" role="alert">{uploadError}</p>
                    )}

                    <InputActions
                        ref={fileInputRef}
                        onChange={handleFileInputChange}
                        processing={isProcessing}
                        attachments={attachments}
                        onClick={() => fileInputRef.current?.click()}
                        loading={isLoading}
                        canAddMore={canAddMore}
                        onClick1={sendMessage}
                        input={input}
                        files={files}/>
                </div>
            </section>
        </main>
    );
}

export default App