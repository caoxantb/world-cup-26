import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { User } from "../models";
import { Forbidden } from "../utils/httpError";

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.signedCookies?.accessToken;
  if (!accessToken) {
    return next();
  }

  const cookieOptions = { ...res.app.get("cookieOptions"), signed: true };
  try {
    const decodedAccessToken = jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_TOKEN_SECRET || "JWT_ACCESS_TOKEN_SECRET"
    );

    const user =
      typeof decodedAccessToken !== "string"
        ? await User.findOne({ email: decodedAccessToken.email })
        : null;
    if (!user) {
      res.clearCookie("accessToken", cookieOptions);
      throw new Forbidden("Unknown user");
    }
    req.user = user;
    next()
  } catch (err) {
    const user = await refreshAccessToken(req, res);
    if (!user) {
      res.clearCookie("accessToken", cookieOptions);
      throw new Forbidden("Unknown user");
    }
    req.user = user;
    next()
  }
};

const refreshAccessToken = async (req: Request, res: Response) => {
  const refreshToken = req.signedCookies?.refreshToken;

  if (!refreshToken) {
    return null;
  }

  const cookieOptions = { ...res.app.get("cookieOptions"), signed: true };
  try {
    const decodedRefreshToken = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET || "JWT_REFRESH_TOKEN_SECRET"
    );

    const user =
      typeof decodedRefreshToken !== "string"
        ? await User.findOne({ email: decodedRefreshToken.email })
        : null;
    if (!user) {
      res.clearCookie("accessToken", cookieOptions);
      throw new Forbidden("Unknown user");
    }

    const newAccessToken = jwt.sign(
      { email: user.email },
      process.env.JWT_ACCESS_TOKEN_SECRET || "JWT_ACCESS_TOKEN_SECRET",
      { expiresIn: "1h" }
    );

    res.cookie("accessToken", newAccessToken, cookieOptions);

    return user;
  } catch (err) {
    res.clearCookie("refreshToken", cookieOptions);
    return null;
  }
};
