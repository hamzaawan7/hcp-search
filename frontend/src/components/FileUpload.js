import React from "react";

const FileUpload = () => {
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log("Uploaded file:", file.name);
        }
    };

    return (
        <div>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        </div>
    );
};

export default FileUpload;
