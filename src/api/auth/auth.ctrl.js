import Joi from 'joi';
import User from '../../models/user';
// 🔺 인스턴스메서드와 정적메서드도 사용가능.

// 1. 회원 가입 (등록)
export const register = async (ctx) => {
  // request body 검증
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
    // username 이미 존재하는지 체크
    const exists = await User.findByUsername(username);
    if (exists) {
      ctx.status = 409; // conflict
      return;
    }

    const user = new User({
      username,
    });
    await user.setPassword(password);
    await user.save(); // DB에 저장

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

// 2. 로그인
export const login = async (ctx) => {
  const { username, password } = ctx.request.body;

  // username, password 없으면 에러
  if (!username || !password) {
    ctx.status = 401; // Unauthorized
    return;
  }

  try {
    const user = await User.findByUsername(username);
    // username이 존재하지 않으면 에러
    if (!user) {
      ctx.status = 401;
      return;
    }
    const valid = await user.checkPassword(password);
    // password 불일치시 에러
    if (!valid) {
      ctx.status = 401;
      return;
    }
    ctx.body = user.serialize();

    // 로그인 성공시 토큰 생성 (쿠키)
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
      httpOnly: true,
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

// 3. 로그인 상태 확인
export const check = async (ctx) => {
  const { user } = ctx.state;
  // 로그인중이 아닐 때
  if (!user) {
    ctx.status = 401;
    return;
  }
  ctx.body = user;
};

// 4. 로그아웃
export const logout = async (ctx) => {
  ctx.cookies.set('access_token');
  ctx.status = 204;
};
