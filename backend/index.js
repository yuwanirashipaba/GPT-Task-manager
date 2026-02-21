const express = require("express");
const { randomUUID } = require("crypto");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Simple CORS middleware so Next frontend can call this API.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

// In-memory "DB" using both a Map and lists.
const tasksById = new Map();
const taskOrder = [];
const tasksByStatus = {
  pending: [],
  completed: [],
};

const priorities = ["Low", "Medium", "High"];

const buildTask = (title, deadline, priority) => ({
  id: randomUUID(),
  title,
  deadline,
  priority,
  completed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const getTaskSnapshot = (task) => ({
  id: task.id,
  title: task.title,
  deadline: task.deadline,
  priority: task.priority,
  completed: task.completed,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

const removeFromList = (list, taskId) => {
  const idx = list.indexOf(taskId);
  if (idx >= 0) {
    list.splice(idx, 1);
  }
};

const setTaskStatusList = (taskId, completed) => {
  removeFromList(tasksByStatus.pending, taskId);
  removeFromList(tasksByStatus.completed, taskId);
  if (completed) {
    tasksByStatus.completed.push(taskId);
  } else {
    tasksByStatus.pending.push(taskId);
  }
};

const listTasks = (ids) =>
  ids
    .map((taskId) => tasksById.get(taskId))
    .filter(Boolean)
    .map(getTaskSnapshot);

const validateTaskPayload = (payload, isCreate = false) => {
  const errors = [];

  if (isCreate || Object.hasOwn(payload, "title")) {
    if (typeof payload.title !== "string" || payload.title.trim().length === 0) {
      errors.push("title is required and must be a non-empty string");
    }
  }

  if (isCreate || Object.hasOwn(payload, "deadline")) {
    if (typeof payload.deadline !== "string" || Number.isNaN(Date.parse(payload.deadline))) {
      errors.push("deadline is required and must be a valid date string");
    }
  }

  if (isCreate || Object.hasOwn(payload, "priority")) {
    if (!priorities.includes(payload.priority)) {
      errors.push(`priority must be one of: ${priorities.join(", ")}`);
    }
  }

  if (Object.hasOwn(payload, "completed") && typeof payload.completed !== "boolean") {
    errors.push("completed must be a boolean");
  }

  return errors;
};

app.get("/api/tasks", (_req, res) => {
  const pending = listTasks(tasksByStatus.pending);
  const completed = listTasks(tasksByStatus.completed);
  const all = listTasks(taskOrder);

  res.json({ pending, completed, all });
});

app.post("/api/tasks", (req, res) => {
  const errors = validateTaskPayload(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const title = req.body.title.trim();
  const task = buildTask(title, req.body.deadline, req.body.priority);

  tasksById.set(task.id, task);
  taskOrder.push(task.id);
  tasksByStatus.pending.push(task.id);

  return res.status(201).json(getTaskSnapshot(task));
});

app.put("/api/tasks/:id", (req, res) => {
  const task = tasksById.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  const errors = validateTaskPayload(req.body, false);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  if (Object.hasOwn(req.body, "title")) {
    task.title = req.body.title.trim();
  }
  if (Object.hasOwn(req.body, "deadline")) {
    task.deadline = req.body.deadline;
  }
  if (Object.hasOwn(req.body, "priority")) {
    task.priority = req.body.priority;
  }
  if (Object.hasOwn(req.body, "completed")) {
    task.completed = req.body.completed;
    setTaskStatusList(task.id, task.completed);
  }
  task.updatedAt = new Date().toISOString();
  return res.json(getTaskSnapshot(task));
});

app.delete("/api/tasks/:id", (req, res) => {
  const task = tasksById.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  tasksById.delete(task.id);
  removeFromList(taskOrder, task.id);
  removeFromList(tasksByStatus.pending, task.id);
  removeFromList(tasksByStatus.completed, task.id);

  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Task API running on http://localhost:${PORT}`);
});
