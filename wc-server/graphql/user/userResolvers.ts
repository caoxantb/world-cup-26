import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response } from "express";

import { User } from "../../models";
import { BadRequest, Unauthorized } from "../../utils/httpError";

dotenv.config();

export const userQueries = {
  getCurrentUser: async (parents: undefined, args: {}, context: {req: Request, res: Response}) => {
    if (context.req.user) {
      const {email} = context.req.user;
      const user = await User.findOne({ email });
      return user || null;
    }
    return null;    
  }
}

export const userMutations = {
  signupWithPassword: async (
    parents: undefined,
    args: { email: string; password: string; name: string },
    context: { req: Request; res: Response }
  ) => {
    const saltRounds = 10;
    const { email, password, name } = args;

    const user = await User.findOne({ email });

    if (user) {
      throw new BadRequest("User already exists");
    }
    if (!password || password.length <= 8) {
      throw new BadRequest("Password must be at least 8 characters");
    }
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      email,
      passwordHash,
      name,
    });

    await newUser.save();

    const accessToken = jwt.sign(
      { email },
      process.env.JWT_ACCESS_TOKEN_SECRET || "JWT_ACCESS_TOKEN_SECRET",
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { email },
      process.env.JWT_REFRESH_TOKEN_SECRET || "JWT_REFRESH_TOKEN_SECRET"
    );

    const cookieOptions = {
      ...context.res.app.get("cookieOptions"),
      signed: true,
    };

    context.res.cookie("accessToken", accessToken, cookieOptions);
    context.res.cookie("refreshToken", refreshToken, cookieOptions);

    return newUser;
  },
  loginWithPassword: async (
    parents: undefined,
    args: { email: string; password: string },
    context: { req: Request; res: Response }
  ) => {
    const { email, password } = args;
    const user = await User.findOne({ email });
    const validCredentials =
      !user || !user.passwordHash
        ? false
        : await bcrypt.compare(password, user.passwordHash);
    if (!(user && validCredentials)) {
      throw new BadRequest("Invalid credentials");
    }

    const accessToken = jwt.sign(
      { email },
      process.env.JWT_ACCESS_TOKEN_SECRET || "JWT_ACCESS_TOKEN_SECRET",
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { email },
      process.env.JWT_REFRESH_TOKEN_SECRET || "JWT_REFRESH_TOKEN_SECRET"
    );

    const cookieOptions = {
      ...context.res.app.get("cookieOptions"),
      signed: true,
    };

    context.res.cookie("accessToken", accessToken, cookieOptions);
    context.res.cookie("refreshToken", refreshToken, cookieOptions);

    return user;
  },
  logout: (
    parents: undefined,
    args: {},
    context: { req: Request; res: Response }
  ) => {
    if (!context.req.user) {
      throw new Unauthorized("No user found");
    }
    context.res.clearCookie("accessToken", {
      ...context.res.app.get("cookieOptions"),
      signed: true,
    });
    context.res.clearCookie("refreshToken", {
      ...context.res.app.get("cookieOptions"),
      signed: true,
    });
  },
};
