import { useState, useEffect } from 'react';

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fallbackTodos = [
    { id: 1, title: 'Inspect raw video footage', completed: true },
    { id: 2, title: 'Draft script voiceovers', completed: true },
    { id: 3, title: 'Re-align task columns in Kanban board', completed: false },
    { id: 4, title: 'Send invite link to freelance colorist', completed: false }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setTodos(fallbackTodos);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="todo-box">
      <h3>Active Project Tasks</h3>
      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading tasks...</p>
      ) : (
        <div className="todo-list">
          {todos.map((todo) => (
            <div className="todo-item" key={todo.id}>
              <div className={`todo-item__content ${todo.completed ? 'done' : ''}`}>
                <span 
                  style={{ 
                    display: 'inline-block', 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '4px', 
                    border: '1px solid var(--brand)',
                    background: todo.completed ? 'var(--brand)' : 'transparent',
                    color: '#fff',
                    textAlign: 'center',
                    lineHeight: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {todo.completed ? '✓' : ''}
                </span>
                <span>{todo.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
