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
    const follows = await prisma.follow.findMany({
      where: { followerId: req.userId },
      select: { followingId: true },
    });
    const followingIds = follows.map((f) => f.followingId);

    const activities = await prisma.activity.findMany({
      where: { userId: { in: [req.userId!, ...followingIds] } },
      orderBy: { startedAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { kudos: true, comments: true } },
        kudos: { where: { userId: req.userId }, select: { id: true } }, // just to check if it's non-empty
      },
    });

    // Reshape the response so the mobile app gets clean, simple fields
    const shaped = activities.map((a) => ({
      ...a,
      kudosCount: a._count.kudos,
      commentCount: a._count.comments,
      hasGivenKudos: a.kudos.length > 0,
      kudos: undefined, // remove the raw array, we only needed it to compute hasGivenKudos
      _count: undefined,
    }));

    res.json(shaped);
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

// Follow a user
app.post("/users/:id/follow", authenticate, async (req: AuthRequest, res) => {
  try {
    const followingId = req.params.id;
    const followerId = req.userId!;

    if (followingId === followerId) {
      return res.status(400).json({ error: "You can't follow yourself" });
    }

    // Confirm the target user actually exists, otherwise this silently
    // creates a Follow row pointing at nothing
    const targetUser = await prisma.user.findUnique({ where: { id: followingId } });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const follow = await prisma.follow.create({
      data: { followerId, followingId },
    });

    res.status(201).json(follow);
  } catch (err: any) {
    if (err.code === "P2002") {
      // Our @@unique([followerId, followingId]) constraint caught a duplicate
      return res.status(409).json({ error: "Already following this user" });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Unfollow a user
app.delete("/users/:id/follow", authenticate, async (req: AuthRequest, res) => {
  try {
    const followingId = req.params.id;
    const followerId = req.userId!;

    await prisma.follow.delete({
      where: {
        // Prisma auto-generates this compound key name from our @@unique constraint:
        // <field1>_<field2>
        followerId_followingId: { followerId, followingId },
      },
    });

    res.status(204).send();
  } catch (err: any) {
    if (err.code === "P2025") {
      // Prisma's error code for "record to delete does not exist"
      return res.status(404).json({ error: "You're not following this user" });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// List users you're following (useful for a "Following" screen later)
app.get("/following", authenticate, async (req: AuthRequest, res) => {
  const follows = await prisma.follow.findMany({
    where: { followerId: req.userId },
    include: { following: { select: { id: true, name: true } } },
  });

  res.json(follows.map((f) => f.following));
});

// List users who follow you
app.get("/followers", authenticate, async (req: AuthRequest, res) => {
  const follows = await prisma.follow.findMany({
    where: { followingId: req.userId },
    include: { follower: { select: { id: true, name: true } } },
  });

  res.json(follows.map((f) => f.follower));
});

app.get("/users/:id/stats", authenticate, async (req: AuthRequest, res) => {
  const userId = req.params.id;

  const [followerCount, followingCount, activityCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.activity.count({ where: { userId } }),
  ]);

  res.json({ followerCount, followingCount, activityCount });
});

// Search/list users (excluding yourself)
app.get("/users", authenticate, async (req: AuthRequest, res) => {
  const search = (req.query.search as string) || "";

  const users = await prisma.user.findMany({
    where: {
      id: { not: req.userId }, // never show yourself in this list
      name: { contains: search, mode: "insensitive" }, // case-insensitive partial match
    },
    select: { id: true, name: true, email: true },
    take: 20, // cap results, avoid dumping the whole users table
  });

  res.json(users);
});


// Give kudos to an activity
app.post("/activities/:id/kudos", authenticate, async (req: AuthRequest, res) => {
  try {
    const activityId = req.params.id;

    const kudos = await prisma.kudos.create({
      data: { userId: req.userId!, activityId },
    });

    res.status(201).json(kudos);
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Already gave kudos to this activity" });
    }
    if (err.code === "P2003") {
      // Foreign key violation — the activityId doesn't exist
      return res.status(404).json({ error: "Activity not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Remove kudos
app.delete("/activities/:id/kudos", authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.kudos.delete({
      where: {
        userId_activityId: { userId: req.userId!, activityId: req.params.id },
      },
    });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "You haven't given kudos to this activity" });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const createCommentSchema = yup.object({
  text: yup.string().trim().min(1, "Comment cannot be empty").max(500, "Comment too long").required(),
});

// Add a comment
app.post("/activities/:id/comments", authenticate, async (req: AuthRequest, res) => {
  try {
    const { text } = await createCommentSchema.validate(req.body, { abortEarly: true });

    const comment = await prisma.comment.create({
      data: { text, userId: req.userId!, activityId: req.params.id },
      include: { user: { select: { id: true, name: true } } },
    });

    res.status(201).json(comment);
  } catch (err: any) {
    if (err instanceof yup.ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === "P2003") {
      return res.status(404).json({ error: "Activity not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// List comments on an activity
app.get("/activities/:id/comments", authenticate, async (req: AuthRequest, res) => {
  const comments = await prisma.comment.findMany({
    where: { activityId: req.params.id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true } } },
  });

  res.json(comments);
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
