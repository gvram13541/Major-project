import React, { useState, useEffect } from "react";

const COMMENTS_KEY = "admin_comments";

const Comments = () => {
  const [comments, setComments] = useState(() => JSON.parse(localStorage.getItem(COMMENTS_KEY)) || []);
  const [text, setText] = useState("");

  useEffect(() => {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  }, [comments]);

  const addComment = () => {
    if (text.trim()) {
      setComments([{ text, timestamp: new Date().toLocaleString() }, ...comments]);
      setText("");
    }
  };

  const deleteComment = idx => setComments(comments.filter((_, i) => i !== idx));

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Comments</h2>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        style={{ width: "100%" }}
        placeholder="Add a comment..."
      />
      <button onClick={addComment} style={{ marginTop: 8 }}>Add Comment</button>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {comments.map((c, idx) => (
          <li key={idx} style={{ margin: "12px 0", background: "#f8f9fa", padding: 12, borderRadius: 6 }}>
            <div>{c.text}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{c.timestamp}</div>
            <button onClick={() => deleteComment(idx)} style={{ marginTop: 4 }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Comments;