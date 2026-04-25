import express from "express";
import env from "../config/env.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { fetchUserProfile, fetchJoinedCommunities } from "../services/userServices.js";
import { getAllTodoOfUser, getAllCompletedTodosOfUser } from "../services/todoServices.js";
import { getTodayFocusSeconds } from "../services/timerServices.js";

const router = express.Router();

const BASE_SYSTEM_PROMPT = `You are Luma, an AI Focus Coach built into Lumora — a productivity platform for deep work and focus.

Your personality:
- Calm, encouraging, and insightful
- You speak concisely — short paragraphs, no fluff
- You use productivity frameworks (Pomodoro, GTD, time-blocking) naturally
- You ask one focused follow-up question when relevant
- You celebrate small wins enthusiastically

Your capabilities:
- Help users plan focus sessions and break tasks into steps
- Suggest Pomodoro schedules tailored to the task
- Give advice on beating procrastination and distraction
- Analyze habits and suggest improvements
- Motivate without being hollow or generic

Always respond in plain text. No markdown headers. Use short bullet points (–) only when listing steps. Keep responses under 120 words unless the user asks for detail.`;

async function buildUserContext(userId) {
	const [profile, pendingTodos, completedTodos, todaySeconds, communities] = await Promise.all([
		fetchUserProfile(userId).catch(() => null),
		getAllTodoOfUser(userId).catch(() => []),
		getAllCompletedTodosOfUser(userId).catch(() => []),
		getTodayFocusSeconds(userId).catch(() => 0),
		fetchJoinedCommunities(userId).catch(() => []),
	]);

	const username = profile?.userId?.username || "the user";
	const streak = profile?.streakCount ?? 0;
	const maxStreak = profile?.maxStreakCount ?? 0;
	const todayMinutes = Math.round(todaySeconds / 60);

	const formatTask = (t) => {
		let line = `– ${t.title}`;
		if (t.description) line += `: ${t.description}`;
		if (t.dueDate) line += ` (due ${new Date(t.dueDate).toLocaleDateString()})`;
		return line;
	};

	const pendingList = pendingTodos.length
		? pendingTodos.map(formatTask).join("\n")
		: "None";

	const recentCompleted = completedTodos.slice(-5);
	const completedList = recentCompleted.length
		? recentCompleted.map((t) => `– ${t.title}`).join("\n")
		: "None";

	const communityList = communities.length
		? communities.map((c) => c.communityName).join(", ")
		: "None";

	return `--- USER CONTEXT (use this to personalise your answer) ---
Name: ${username}
Current streak: ${streak} day${streak !== 1 ? "s" : ""} (best: ${maxStreak})
Focus time today: ${todayMinutes} minute${todayMinutes !== 1 ? "s" : ""}
Pending tasks (${pendingTodos.length}):
${pendingList}
Recently completed tasks:
${completedList}
Communities joined: ${communityList}
--- END USER CONTEXT ---`;
}

router.post("/chat", authenticate, async (req, res) => {
	const { messages } = req.body;

	if (!messages || !Array.isArray(messages)) {
		return res.status(400).json({ error: "messages array is required" });
	}

	if (!env.OPENROUTER_API_KEY) {
		return res.status(500).json({ error: "AI service not configured" });
	}

	const userContext = await buildUserContext(req.auth.userId);
	const systemPrompt = `${BASE_SYSTEM_PROMPT}\n\n${userContext}`;

	try {
		const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
				"Content-Type": "application/json",
				"HTTP-Referer": env.CLIENT_URL,
				"X-Title": "Lumora Focus Coach",
			},
			body: JSON.stringify({
				model: "meta-llama/llama-3.1-8b-instruct:free",
				messages: [
					{ role: "system", content: systemPrompt },
					...messages,
				],
				stream: true,
				max_tokens: 400,
				temperature: 0.7,
			}),
		});

		if (!response.ok) {
			const err = await response.text();
			return res.status(response.status).json({ error: err });
		}

		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");

		const reader = response.body.getReader();
		const decoder = new TextDecoder();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value, { stream: true });
			const lines = chunk.split("\n").filter(l => l.trim());

			for (const line of lines) {
				if (!line.startsWith("data:")) continue;
				const data = line.slice(5).trim();
				if (data === "[DONE]") {
					res.write("data: [DONE]\n\n");
					continue;
				}
				try {
					const json = JSON.parse(data);
					const delta = json.choices?.[0]?.delta?.content;
					if (delta) {
						res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
					}
				} catch {
					// malformed chunk — skip
				}
			}
		}

		res.end();
	} catch (error) {
		if (!res.headersSent) {
			res.status(500).json({ error: "AI service error" });
		}
	}
});

export default router;
