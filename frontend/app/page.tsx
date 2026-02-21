"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Priority = "Low" | "Medium" | "High";

type Task = {
  id: string;
  title: string;
  deadline: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

type TaskResponse = {
  pending: Task[];
  completed: Task[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const priorityStyles: Record<Priority, string> = {
  Low: "bg-green-100 text-green-800 border-green-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  High: "bg-red-100 text-red-800 border-red-200",
};

const todayDate = () => new Date().toISOString().split("T")[0];

export default function Home() {
  const [tasks, setTasks] = useState<TaskResponse>({ pending: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState(todayDate());
  const [editPriority, setEditPriority] = useState<Priority>("Medium");
  const [newTask, setNewTask] = useState({
    title: "",
    deadline: todayDate(),
    priority: "Medium" as Priority,
  });

  const totalCount = useMemo(
    () => tasks.pending.length + tasks.completed.length,
    [tasks.pending.length, tasks.completed.length],
  );

  const fetchTasks = async () => {
    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/api/tasks`);
      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }
      const data: TaskResponse = await response.json();
      setTasks({ pending: data.pending, completed: data.completed });
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTasks();
  }, []);

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTask.title.trim()) {
      setError("Title is required");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error("Failed to add task");
      }

      setNewTask({ title: "", deadline: todayDate(), priority: "Medium" });
      await fetchTasks();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to add task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete task");
      }
      await fetchTasks();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete task");
    }
  };

  const handleToggleComplete = async (task: Task) => {
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          deadline: task.deadline,
          priority: task.priority,
          completed: !task.completed,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update task status");
      }
      await fetchTasks();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update task");
    }
  };

  const beginEditTask = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDeadline(task.deadline.split("T")[0]);
    setEditPriority(task.priority);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDeadline(todayDate());
    setEditPriority("Medium");
  };

  const saveEdit = async (task: Task) => {
    if (!editTitle.trim()) {
      setError("Edited title cannot be empty");
      return;
    }

    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          deadline: editDeadline,
          priority: editPriority,
          completed: task.completed,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to save task");
      }
      cancelEdit();
      await fetchTasks();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save task");
    }
  };

  const renderTaskCard = (task: Task) => {
    const isEditing = editingId === task.id;
    return (
      <li
        key={task.id}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                />
                <div className="flex flex-wrap gap-2">
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(event) => setEditDeadline(event.target.value)}
                    className="rounded border border-gray-300 px-3 py-2"
                  />
                  <select
                    value={editPriority}
                    onChange={(event) => setEditPriority(event.target.value as Priority)}
                    className="rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Deadline: {new Date(task.deadline).toLocaleDateString()}
                </p>
              </>
            )}
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${priorityStyles[isEditing ? editPriority : task.priority]}`}
          >
            {isEditing ? editPriority : task.priority} Priority
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleToggleComplete(task)}
            className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            type="button"
          >
            {task.completed ? "Mark as Pending" : "Mark as Done"}
          </button>

          {isEditing ? (
            <>
              <button
                onClick={() => void saveEdit(task)}
                className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                type="button"
              >
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="rounded bg-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
                type="button"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => beginEditTask(task)}
              className="rounded bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
              type="button"
            >
              Edit
            </button>
          )}

          <button
            onClick={() => void handleDeleteTask(task.id)}
            className="rounded bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
            type="button"
          >
            Delete
          </button>
        </div>
      </li>
    );
  };

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10 text-gray-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold">Task Management App</h1>
          <p className="mt-2 text-gray-600">
            Single-page task manager with full CRUD, deadline tracking, completion status, and priority levels.
          </p>
          <p className="mt-2 text-sm text-gray-500">Total Tasks: {totalCount}</p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Create Task</h2>
          <form onSubmit={handleCreateTask} className="grid gap-3 md:grid-cols-4">
            <input
              value={newTask.title}
              onChange={(event) => setNewTask((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Task title"
              className="rounded border border-gray-300 px-3 py-2 md:col-span-2"
            />
            <input
              type="date"
              value={newTask.deadline}
              onChange={(event) => setNewTask((prev) => ({ ...prev, deadline: event.target.value }))}
              className="rounded border border-gray-300 px-3 py-2"
            />
            <select
              value={newTask.priority}
              onChange={(event) =>
                setNewTask((prev) => ({ ...prev, priority: event.target.value as Priority }))
              }
              className="rounded border border-gray-300 px-3 py-2"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 md:col-span-4"
            >
              {submitting ? "Adding Task..." : "Add Task"}
            </button>
          </form>
          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Pending Tasks ({tasks.pending.length})</h2>
            {loading ? (
              <p className="text-gray-600">Loading tasks...</p>
            ) : tasks.pending.length === 0 ? (
              <p className="text-gray-600">No pending tasks.</p>
            ) : (
              <ul className="space-y-3">{tasks.pending.map(renderTaskCard)}</ul>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Completed Tasks ({tasks.completed.length})</h2>
            {loading ? (
              <p className="text-gray-600">Loading tasks...</p>
            ) : tasks.completed.length === 0 ? (
              <p className="text-gray-600">No completed tasks.</p>
            ) : (
              <ul className="space-y-3">{tasks.completed.map(renderTaskCard)}</ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
