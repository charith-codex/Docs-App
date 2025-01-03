import { useRef } from 'react';
import ReactQuill from 'react-quill';

export const TextEditor = () => {
  const quillRef = useRef(null);
  return (
    <div className="google-docs-editor">
      <ReactQuill ref={quillRef} />
    </div>
  );
};
