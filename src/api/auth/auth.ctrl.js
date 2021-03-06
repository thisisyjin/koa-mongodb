import Joi from 'joi';
import User from '../../models/user';
// ๐บ ์ธ์คํด์ค๋ฉ์๋์ ์ ์ ๋ฉ์๋๋ ์ฌ์ฉ๊ฐ๋ฅ.

// 1. ํ์ ๊ฐ์ (๋ฑ๋ก)
export const register = async (ctx) => {
  // request body ๊ฒ์ฆ
  const schema = Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(20).required(),
    password: Joi.string().required(),
  });

  const result = schema.validate(ctx.request.body);

  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const { username, password } = ctx.request.body;
  try {
    // username ์ด๋ฏธ ์กด์ฌํ๋์ง ์ฒดํฌ
    const exists = await User.findByUsername(username);
    if (exists) {
      ctx.status = 409; // conflict
      return;
    }

    const user = new User({
      username,
    });
    await user.setPassword(password);
    await user.save(); // DB์ ์ ์ฅ

    ctx.body = user.serialize();
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
      httpOnly: true,
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

// 2. ๋ก๊ทธ์ธ
export const login = async (ctx) => {
  const { username, password } = ctx.request.body;

  // username, password ์์ผ๋ฉด ์๋ฌ
  if (!username || !password) {
    ctx.status = 401; // Unauthorized
    return;
  }

  try {
    const user = await User.findByUsername(username);
    // username์ด ์กด์ฌํ์ง ์์ผ๋ฉด ์๋ฌ
    if (!user) {
      ctx.status = 401;
      return;
    }
    const valid = await user.checkPassword(password);
    // password ๋ถ์ผ์น์ ์๋ฌ
    if (!valid) {
      ctx.status = 401;
      return;
    }
    ctx.body = user.serialize();

    // ๋ก๊ทธ์ธ ์ฑ๊ณต์ ํ ํฐ ์์ฑ (์ฟ ํค)
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
      httpOnly: true,
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

// 3. ๋ก๊ทธ์ธ ์ํ ํ์ธ
export const check = async (ctx) => {
  const { user } = ctx.state;
  // ๋ก๊ทธ์ธ์ค์ด ์๋ ๋
  if (!user) {
    ctx.status = 401;
    return;
  }
  ctx.body = user;
};

// 4. ๋ก๊ทธ์์
export const logout = async (ctx) => {
  ctx.cookies.set('access_token');
  ctx.status = 204;
};
