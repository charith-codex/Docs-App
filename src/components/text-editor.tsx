import { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import { db } from '../firebase-config';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import 'react-quill/dist/quill.snow.css';
import '../App.css';
import { throttle } from 'lodash';

export const TextEditor = () => {
  const quillRef = useRef<ReactQuill | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const isLocalChange = useRef(false);
  const documentRef = doc(db, 'documents', 'sample-doc');

  const saveContent = throttle(() => {
  // const saveContent = () => {
    if (quillRef.current && isLocalChange.current) {
      const content = quillRef.current.getEditor().getContents();
      console.log(content);

      setDoc(documentRef, { content: content.ops }, { merge: true })
        .then(() => console.log('content saved'))
        .catch(console.error);
      isLocalChange.current = false;
    }
  // };
  }, 2000);

  useEffect(() => {
    if (quillRef.current) {
      // --- load initial content from firebase
      getDoc(documentRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const savedContent = docSnap.data().content;
            if (savedContent) {
              if (quillRef.current) {
                quillRef.current.getEditor().setContents(savedContent);
              }
            } else {
              console.log('No content found. Start with a blank document');
            }
          }
        })
        .catch(console.error);

      // --- listen to fireStore for any updates and update locally in realtime
      const unSubscribe = onSnapshot(documentRef, (snapshot) => {
        if (snapshot.exists()) {
          const newContent = snapshot.data().content;

          if (!isEditing) {
            const editor = quillRef.current?.getEditor();
            const currentCursorPosition = editor?.getSelection()?.index || 0;

            if (editor) {
              editor.setContents(newContent, 'silent');
              editor.setSelection(currentCursorPosition);
            }
          }
        }
      });

      // --- listen for local text changes and save it to firebase
      const editor = quillRef.current.getEditor();
      editor.on('text-change', (_, __, source: any) => {
        if (source === 'user') {
          isLocalChange.current = true;
          setIsEditing(true);
          console.log('isEditing:', isEditing); // Temporary use to avoid deploy error
          saveContent();

          setTimeout(() => setIsEditing(false), 5000);
        }
      });

      return () => {
        unSubscribe();
        editor.off('text-change');
      };
    }
  }, []);

  return (
    <div className="google-docs-editor">
      <ReactQuill ref={quillRef} />
    </div>
  );
};
