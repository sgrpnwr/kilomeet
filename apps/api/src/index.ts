import "dotenv/config";
import express from "express";
import { prisma } from "./lib/prisma";
import { signupSchema, loginSchema } from "./validators/auth";
import * as yup from "yup";
import jwt from "jsonwebtoken";
import { createActivitySchema } from "./validators/activity";

import { authenticate, AuthRequest } from "./middleware/auth";

import bcrypt from "bcrypt";
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Kilomeet API is running" });
});

app.get("/me", authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, createdAt: true }, // never send back the password hash
  });

  res.json(user);
});

app.get("/activities", authenticate, async (req: AuthRequest, res) => {
  try {
    const activities = await prisma.activity.findMany({
      where: { userId: req.userId },
      orderBy: { startedAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true }, // never leak password/email here
        },
      },
    });

    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/activities", authenticate, async (req: AuthRequest, res) => {
  try {
    const { type, distance, duration, startedAt } =
      await createActivitySchema.validate(req.body, { abortEarly: true });

    const activity = await prisma.activity.create({
      data: {
        type,
        distance,
        duration,
        startedAt,
        userId: req.userId!, // set by our auth middleware — the "!" tells TS "trust me, authenticate() guarantees this exists"
      },
    });

    res.status(201).json(activity);
  } catch (err: any) {
    if (err instanceof yup.ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = await loginSchema.validate(req.body, {
      abortEarly: true,
    });

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Deliberately vague — don't reveal whether it was the email or password that was wrong.
      // This stops attackers from being able to "probe" which emails exist in your system.
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create a JWT — a signed token containing the user's id.
    // "Signed" means the server can verify later that this token wasn't tampered with,
    // without needing to look anything up in the database first.
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }, // token auto-expires after 7 days, forcing re-login
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err: any) {
    if (err instanceof yup.ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = await signupSchema.validate(req.body, {
      abortEarly: true,
    });

    // 10 = "salt rounds" — how many times the hashing algorithm loops.
    // Higher = more secure but slower. 10 is the standard, safe default.
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch (err: any) {
    if (err instanceof yup.ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email already in use" });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Kilomeet API running on http://localhost:${PORT}`);
});
