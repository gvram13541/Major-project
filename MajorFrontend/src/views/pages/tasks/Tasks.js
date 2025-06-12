import React, { useState, useEffect } from "react";

const TASKS_KEY = "admin_tasks";

const loadTasks = () => {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
  } catch {
    return [];
  }
};

const saveTasks = (tasks) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

const Tasks = () => {
  const [tasks, setTasks] = useState(loadTasks());
  const [newTask, setNewTask] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([{ text: newTask, done: false }, ...tasks]);
      setNewTask("");
    }
  };

  const deleteTask = (idx) => {
    setTasks(tasks.filter((_, i) => i !== idx));
  };

  const toggleDone = (idx) => {
    setTasks(tasks.map((task, i) => i === idx ? { ...task, done: !task.done } : task));
  };

  const startEdit = (idx) => {
    setEditIdx(idx);
    setEditText(tasks[idx].text);
  };

  const saveEdit = (idx) => {
    setTasks(tasks.map((task, i) => i === idx ? { ...task, text: editText } : task));
    setEditIdx(null);
    setEditText("");
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Admin Tasks</h2>
      <div style={{ display: "flex", marginBottom: 16 }}>
        <input
          type="text"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          style={{ flex: 1, marginRight: 8 }}
        />
        <button onClick={addTask}>Add</button>
      </div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.length === 0 && <li>No tasks yet.</li>}
        {tasks.map((task, idx) => (
          <li key={idx} style={{
            marginBottom: 12,
            background: "#f8f9fa",
            padding: 12,
            borderRadius: 6,
            display: "flex",
            alignItems: "center"
          }}>
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleDone(idx)}
              style={{ marginRight: 8 }}
            />
            {editIdx === idx ? (
              <>
                <input
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <button onClick={() => saveEdit(idx)}>Save</button>
                <button onClick={() => setEditIdx(null)} style={{ marginLeft: 4 }}>Cancel</button>
              </>
            ) : (
              <>
                <span style={{
                  textDecoration: task.done ? "line-through" : "none",
                  flex: 1
                }}>{task.text}</span>
                <button onClick={() => startEdit(idx)} style={{ marginLeft: 8 }}>Edit</button>
                <button onClick={() => deleteTask(idx)} style={{ marginLeft: 4 }}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Tasks;