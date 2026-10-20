/**
 * Shows the files attached to the message being written, each with a remove button.
 * Images get a thumbnail, other files a chip with the file name.
 * @param {{id: number, file: File, previewUrl: string|null}[]} attachments
 * @param {(id: number) => void} removeFile
 */
function Attachments({attachments, removeFile}) {
    return (
        <div className="attachment-list">
            {attachments.map(({id, file, previewUrl}) => (
                <div className="attachment-preview" key={id}>
                    {previewUrl ? (
                        <img className="embedded-image" src={previewUrl} alt={file.name}
                             title={file.name}/>
                    ) : (
                        <span className="file-chip" title={file.name}>
                            <span className="file-chip-icon" aria-hidden="true">📄</span>
                            <span className="file-chip-name">{file.name}</span>
                        </span>
                    )}
                    <button
                        type="button"
                        className="remove-attachment"
                        onClick={() => removeFile(id)}
                        aria-label={`Ta bort ${file.name}`}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}

export default Attachments;